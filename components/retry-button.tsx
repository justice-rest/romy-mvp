'use client'

import { RepeatIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface RetryButtonProps {
  reload: () => Promise<void | string | null | undefined>
  messageId: string
}

export const RetryButton: React.FC<RetryButtonProps> = ({
  reload,
  messageId
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="size-8 p-0 rounded-full"
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => reload()}
            aria-label={`Retry from message ${messageId}`}
          >
            <HugeiconsIcon icon={RepeatIcon} size={14} color="currentColor" strokeWidth={2} />
            <span className="sr-only">Retry</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Rewrite</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
