import { Badge } from '@/components/ui/badge'

export function BetaBadge() {
  return (
    <Badge
      variant="secondary"
      className="px-3 py-1 text-xs font-semibold"
      style={{
        background: '#d19e1d',
        backgroundImage:
          'linear-gradient(to right, #d19e1d, #ffd86e, #e3a812)'
      }}
    >
      BETA
    </Badge>
  )
}
