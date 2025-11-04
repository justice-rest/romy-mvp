import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { type Model } from '@/lib/types/models'

// Function to generate a UUID
export function generateUUID(): string {
  // Generate UUIDv4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Sanitizes a URL by replacing spaces with '%20'
 * @param url - The URL to sanitize
 * @returns The sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.replace(/\s+/g, '%20')
}

export function createModelId(model: Model): string {
  return `${model.providerId}:${model.id}`
}

export function getDefaultModelId(models: Model[]): string {
  if (!models.length) {
    throw new Error('No models available')
  }
  return createModelId(models[0])
}

/**
 * Extracts domain from a URL
 */
function extractDomain(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return ''
  const urlPattern = /^https?:\/\/([^/?#]+)(?:[/?#]|$)/i
  return url.match(urlPattern)?.[1] || url
}

/**
 * Cleans title by removing brackets and parentheses content
 */
export function cleanTitle(title: string): string {
  return title
    .replace(/\[.*?\]/g, '') // Remove [content]
    .replace(/\(.*?\)/g, '') // Remove (content)
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim() // Remove leading/trailing whitespace
}

/**
 * Deduplicates items by domain and URL
 */
export function deduplicateByDomainAndUrl<T extends { url: string }>(
  items: T[]
): T[] {
  const seenDomains = new Set<string>()
  const seenUrls = new Set<string>()

  return items.filter((item) => {
    const domain = extractDomain(item.url)
    const isNewUrl = !seenUrls.has(item.url)
    const isNewDomain = !seenDomains.has(domain)

    if (isNewUrl && isNewDomain) {
      seenUrls.add(item.url)
      seenDomains.add(domain)
      return true
    }
    return false
  })
}
