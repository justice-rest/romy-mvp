'use client'

import { useMemo, useState } from 'react'

import { UseChatHelpers } from '@ai-sdk/react'
import { Copy01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'

import type { SearchResultItem } from '@/lib/types'
import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'
import { processCitations } from '@/lib/utils/citation'

import { ChatShare } from './chat-share'
import { ExportButton } from './export-button'
import { RetryButton } from './retry-button'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'

interface MessageActionsProps {
  message: string
  messageId: string
  traceId?: string
  feedbackScore?: number | null
  reload?: () => Promise<void | string | null | undefined>
  chatId?: string
  enableShare?: boolean
  className?: string
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  visible?: boolean
  citationMaps?: Record<string, Record<number, SearchResultItem>>
}

export function MessageActions({
  message,
  messageId,
  traceId,
  feedbackScore: initialFeedbackScore,
  reload,
  chatId,
  enableShare,
  className,
  status,
  visible = true,
  citationMaps
}: MessageActionsProps) {
  const [feedbackScore, setFeedbackScore] = useState<number | null>(
    initialFeedbackScore ?? null
  )
  const mappedMessage = useMemo(() => {
    if (!message) return ''
    return processCitations(message, citationMaps || {})
  }, [message, citationMaps])

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const isLoading = status === 'submitted' || status === 'streaming'

  // Keep the element mounted during loading to preserve layout; otherwise skip rendering.
  if (!visible && !isLoading) {
    return null
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(mappedMessage)
    toast.success('Message copied to clipboard')
  }

  async function handleFeedback(score: number) {
    if (isSubmittingFeedback || !traceId) return

    setIsSubmittingFeedback(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId,
          score,
          messageId
        })
      })

      if (response.ok) {
        setFeedbackScore(score)
        toast.success(
          score === 1
            ? 'Thanks for the feedback!'
            : 'Thanks for letting us know!'
        )
      } else {
        console.error('Failed to submit feedback')
        toast.error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'flex items-center justify-between w-full transition-opacity duration-200',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0 invisible',
        className
      )}
    >
      {/* Left side: Retry, Copy, Export */}
      <div className="flex items-center gap-1">
        {reload && <RetryButton reload={reload} messageId={messageId} />}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="size-8 p-0 rounded-full"
              >
                <HugeiconsIcon icon={Copy01Icon} size={14} color="currentColor" strokeWidth={2} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {traceId && (
          <>
            {(feedbackScore === null || feedbackScore === 1) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback(1)}
                disabled={isSubmittingFeedback || feedbackScore === 1}
                className="size-8 p-0 rounded-full"
              >
                <ThumbsUp
                  size={14}
                  className={feedbackScore === 1 ? 'fill-current' : ''}
                />
              </Button>
            )}
            {(feedbackScore === null || feedbackScore === -1) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleFeedback(-1)}
                disabled={isSubmittingFeedback || feedbackScore === -1}
                className="size-8 p-0 rounded-full"
              >
                <ThumbsDown
                  size={14}
                  className={feedbackScore === -1 ? 'fill-current' : ''}
                />
              </Button>
            )}
          </>
        )}
        <ExportButton content={mappedMessage} />
      </div>

      {/* Right side: Share */}
      {enableShare && chatId && (
        <div className="flex items-center">
          <ChatShare chatId={chatId} />
        </div>
      )}
    </div>
  )
}
