'use client'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'

import { FileText, HelpCircle, LucideIcon, Newspaper, Scale, Search } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './ui/button'

/** ===========================
 *  Geo + Rotation Utilities
 *  =========================== */

// Try to infer user location. We keep it privacy-friendly and cache locally.
type UserRegion = {
  city?: string
  stateOrRegion?: string
  country?: string
}

async function reverseGeocode(lat: number, lon: number): Promise<UserRegion | null> {
  try {
    // OpenStreetMap Nominatim reverse geocoding (rate-limited; be gentle).
    // You may proxy this in production to avoid CORS/rate limits.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) return null
    const data = await res.json()
    const a = data?.address || {}
    return {
      city: a.city || a.town || a.village,
      stateOrRegion: a.state || a.region,
      country: a.country
    }
  } catch {
    return null
  }
}

async function ipLookup(): Promise<UserRegion | null> {
  try {
    // Free IP geolocation fallback. Swap endpoint as needed (ipinfo, ipapi, etc.).
    const res = await fetch('https://ipapi.co/json/')
    if (!res.ok) return null
    const data = await res.json()
    return {
      city: data.city,
      stateOrRegion: data.region, // e.g., "Michigan"
      country: data.country_name
    }
  } catch {
    return null
  }
}

async function inferUserRegion(): Promise<UserRegion> {
  // 0) Cached?
  const cached = typeof window !== 'undefined' ? localStorage.getItem('ngo_user_region') : null
  if (cached) {
    try { return JSON.parse(cached) } catch {}
  }

  // 1) Try browser geolocation → reverse geocode
  const geo = await new Promise<GeolocationPosition | null>(resolve => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000 }
    )
  })

  if (geo?.coords) {
    const rev = await reverseGeocode(geo.coords.latitude, geo.coords.longitude)
    if (rev) {
      localStorage.setItem('ngo_user_region', JSON.stringify(rev))
      return rev
    }
  }

  // 2) Fall back to IP geolocation
  const byIp = await ipLookup()
  if (byIp) {
    localStorage.setItem('ngo_user_region', JSON.stringify(byIp))
    return byIp
  }

  // 3) Last resort default (keeps prompts readable)
  const fallback: UserRegion = { stateOrRegion: 'your region', country: '' }
  localStorage.setItem('ngo_user_region', JSON.stringify(fallback))
  return fallback
}

// Rotating causes (edit freely)
const ROTATING_CAUSES = [
  'education access',
  'women’s economic empowerment',
  'WASH (water, sanitation, hygiene)',
  'rural healthcare',
  'climate resilience',
  'youth skilling'
]

// Build rotating RFP search links (changes on each render/click)
function buildRfpQueries(cause: string, region: string) {
  const q = encodeURIComponent(`${cause} ${region} "RFP" OR "grant" OR "call for proposals"`)
  return [
    // Google wide sweep
    `https://www.google.com/search?q=${q}`,
    // Government portals (swap/add for your focus countries)
    `https://www.grants.gov/search-results?search=${encodeURIComponent(cause)}&state=${encodeURIComponent(region)}`,
    // CSR or philanthropy news sweeps
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} CSR grant announcement`)}`,
    // NGO portals / boards (generalized search)
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} site:fundsforngos.org RFP`)}`,
  ]
}

// Build rotating GuideStar / Candid style searches (profile discovery)
function buildCandidGuidestarQueries(cause: string, region: string) {
  return [
    // GuideStar site search
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} site:guidestar.org profile`)}`,
    // Candid articles / funds pages
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} site:candid.org`)}`,
    // Foundation Directory (proxy via open web since FDO is gated)
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} foundation grants`)}`,
    // Charity Navigator as a supplement
    `https://www.google.com/search?q=${encodeURIComponent(`${cause} ${region} site:charitynavigator.org`)}`,
  ]
}

/** ===========================
 *  Original Types/Constants
 *  =========================== */

const FOCUS_OUT_DELAY_MS = 100

interface ActionCategory {
  icon: LucideIcon
  label: string
  key: string
}

const actionCategories: ActionCategory[] = [
  { icon: Search, label: 'Research', key: 'research' },
  { icon: Scale, label: 'Compare', key: 'compare' },
  { icon: Newspaper, label: 'Latest', key: 'latest' },
  { icon: FileText, label: 'Summarize', key: 'summarize' },
  { icon: HelpCircle, label: 'Explain', key: 'explain' }
]

const basePromptSamples: Record<string, string[]> = {
  research: [
    "Who funds (+cause) in (+region)? List foundations and recent grantees.",
    "Find major donors who’ve given to similar NGOs in the last 3 years.",
    "Which corporates have CSR programs aligned with (+cause)?",
    "Pull 990 insights: top funders donating to (+cause) with average grant size."
  ],
  compare: [
    "Compare fundraising CRMs for small NGOs: Bloomerang vs Little Green Light vs Neon One.",
    "GuideStar/Candid vs DonorSearch vs Donorbox: which is best for donor prospect research?",
    "Compare corporate CSR grants for (+cause): eligibility, cycles, typical amounts.",
    "Grant portals: Candid vs fundsforNGOs vs government e-procurement—pros/cons for discovery."
  ],
  latest: [
    "New grant opportunities this month for (+cause) in (+country/region).",
    "Recent CSR announcements supporting (+cause) (past 30 days).",
    "Foundations changing priorities or opening new cycles this quarter for (+cause).",
    "Policy or tax changes affecting charitable giving in (+country) this year."
  ],
  summarize: [
    "Summarize this RFP: <paste RFP link>. Extract eligibility, deadlines, budget caps, must-haves.",
    "Summarize a donor’s 990 PF: giving focus, average grant size, typical grantees.",
    "Create a 1-page brief on a prospective corporate partner’s CSR focus areas.",
    "Summarize: <GuideStar/Candid profile link> → mission, programs, impact metrics, rating tiers."
  ],
  explain: [
    "Explain Donor-Advised Funds (DAFs) and how NGOs can cultivate DAF donors.",
    "Restricted vs unrestricted funding—how to position asks for each?",
    "Wealth markers & affinity: what to research before a major-gift meeting?",
    "What makes a strong theory-of-change/impact metric set for grant proposals?"
  ]
}

interface ActionButtonsProps {
  onSelectPrompt: (prompt: string) => void
  onCategoryClick: (category: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement>
  className?: string
}

export interface ActionButtonsHandle {
  setActiveCategory: (category: string) => void
}

export const ActionButtons = forwardRef<ActionButtonsHandle, ActionButtonsProps>(({
  onSelectPrompt,
  onCategoryClick,
  inputRef,
  className
}, ref) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [userRegion, setUserRegion] = useState<UserRegion>({})
  const [rotationIndex, setRotationIndex] = useState(0) // rotates cause & link pick
  const containerRef = useRef<HTMLDivElement>(null)

  // Infer region once on mount (cached)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const region = await inferUserRegion()
      if (mounted) setUserRegion(region)
    })()
    return () => { mounted = false }
  }, [])

  // Rotate cause (and link choice) whenever a category is opened
  const rotate = () => setRotationIndex((i) => (i + 1) % 1024)

  // Derive pretty strings
  const prettyRegion =
    userRegion.stateOrRegion ||
    userRegion.country ||
    'your region'

  const prettyCountryOrRegion =
    (userRegion.country && userRegion.stateOrRegion)
      ? `${userRegion.country}/${userRegion.stateOrRegion}`
      : (userRegion.country || userRegion.stateOrRegion || 'your country/region')

  const currentCause = ROTATING_CAUSES[rotationIndex % ROTATING_CAUSES.length]

  // Build rotating links
  const rfpLinks = useMemo(() => buildRfpQueries(currentCause, prettyRegion), [currentCause, prettyRegion])
  const candidLinks = useMemo(() => buildCandidGuidestarQueries(currentCause, prettyRegion), [currentCause, prettyRegion])

  // Token replacement
  const tokenReplace = (text: string) => {
    // pick one link per render; rotate separately for RFP and Candid
    const rfpLink = rfpLinks[rotationIndex % rfpLinks.length]
    const cgLink = candidLinks[rotationIndex % candidLinks.length]

    return text
      .replaceAll('(+region)', prettyRegion)
      .replaceAll('(+country/region)', prettyCountryOrRegion)
      .replaceAll('(+cause)', currentCause)
      .replaceAll('<paste RFP link>', rfpLink)
      .replaceAll('<GuideStar/Candid profile link>', cgLink)
  }

  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    setActiveCategory: (category: string) => {
      setActiveCategory(category)
    }
  }))

  const handleCategoryClick = (category: ActionCategory) => {
    setActiveCategory(category.key)
    onCategoryClick(category.label)
    rotate() // advance cause/link choice when opening a category
  }

  const handlePromptClick = (prompt: string) => {
    setActiveCategory(null)
    onSelectPrompt(tokenReplace(prompt))
    rotate() // advance on selection as well, so next click feels fresh
  }

  const resetToButtons = () => {
    setActiveCategory(null)
  }

  // Handle Escape key and clicks/focus outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeCategory) {
        resetToButtons()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (activeCategory) {
          if (!inputRef?.current?.contains(e.target as Node)) {
            resetToButtons()
          }
        }
      }
    }

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeElement = document.activeElement
        if (
          activeCategory &&
          !containerRef.current?.contains(activeElement) &&
          activeElement !== inputRef?.current
        ) {
          resetToButtons()
        }
      }, FOCUS_OUT_DELAY_MS)
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('focusout', handleFocusOut)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('focusout', handleFocusOut)
    }
  }, [activeCategory, inputRef])

  // Calculate max height needed for samples (4 items * ~40px + padding)
  const containerHeight = 'h-[180px]'

  // Replace tokens for the currently active list (computed just-in-time)
  const renderedSamples = useMemo(() => {
    if (!activeCategory) return []
    const list = basePromptSamples[activeCategory] || []
    return list.map(tokenReplace)
  }, [activeCategory, rotationIndex, prettyRegion, prettyCountryOrRegion, currentCause])

  return (
    <div ref={containerRef} className={cn('relative', containerHeight, className)}>
      <div className="relative h-full">
        {/* Action buttons */}
        <div
          className={cn(
            'absolute inset-0 flex items-start justify-center pt-2 transition-opacity duration-300',
            activeCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          <div className="flex flex-wrap justify-center gap-2 px-2">
            {actionCategories.map(category => {
              const Icon = category.icon
              return (
                <Button
                  key={category.key}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap rounded-full',
                    'text-xs sm:text-sm px-3 sm:px-4'
                  )}
                  onClick={() => handleCategoryClick(category)}
                >
                  <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{category.label}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Prompt samples */}
        <div
          className={cn(
            'absolute inset-0 py-1 space-y-1 overflow-y-auto scrollbar-hide transition-opacity duration-300',
            !activeCategory ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
        >
          {activeCategory && renderedSamples.map((prompt, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 rounded-md text-sm',
                'hover:bg-muted transition-colors',
                'flex items-center gap-2 group'
              )}
              onClick={() => handlePromptClick(prompt)}
              title={prompt}
            >
              <Search className="h-3 w-3 text-muted-foreground flex-shrink-0 group-hover:text-foreground" />
              <span className="line-clamp-1">{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

ActionButtons.displayName = 'ActionButtons'
