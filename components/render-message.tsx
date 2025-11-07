import { useState } from 'react'

import { UseChatHelpers } from '@ai-sdk/react'

import type { SearchResultItem } from '@/lib/types'
import type {
  UIDataTypes,
  UIMessage,
  UIMessageMetadata,
  UITools
} from '@/lib/types/ai'
import type { DynamicToolPart } from '@/lib/types/dynamic-tools'
import { getCookie } from '@/lib/utils/cookies'

import { AnswerSection } from './answer-section'
import { DynamicToolDisplay } from './dynamic-tool-display'
import ResearchProcessSection from './research-process-section'
import { UserFileSection } from './user-file-section'
import { UserTextSection } from './user-text-section'

type SuggestionDisplayMode = 'related' | 'actions' | 'both'

interface RenderMessageProps {
  message: UIMessage
  messageId: string
  getIsOpen: (id: string, partType?: string, hasNextPart?: boolean) => boolean
  onOpenChange: (id: string, open: boolean) => void
  onQuerySelect: (query: string) => void
  onHighlight?: (text: string) => void
  chatId?: string
  status?: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  addToolResult?: (params: { toolCallId: string; result: any }) => void
  onUpdateMessage?: (messageId: string, newContent: string) => Promise<void>
  reload?: (messageId: string) => Promise<void | string | null | undefined>
  isLatestMessage?: boolean
  citationMaps?: Record<string, Record<number, SearchResultItem>>
}

export function RenderMessage({
  message,
  messageId,
  getIsOpen,
  onOpenChange,
  onQuerySelect,
  onHighlight,
  chatId,
  status,
  addToolResult,
  onUpdateMessage,
  reload,
  isLatestMessage = false,
  citationMaps = {}
}: RenderMessageProps) {
  const [suggestionMode, setSuggestionMode] = useState<SuggestionDisplayMode>(
    () => {
      const saved = getCookie('suggestionDisplayMode')
      return (saved as SuggestionDisplayMode) || 'actions'
    }
  )

  const handleSuggestionModeChange = (mode: SuggestionDisplayMode) => {
    setSuggestionMode(mode)
  }

  // Use provided citation maps (from all messages)
  if (message.role === 'user') {
    return (
      <>
        {message.parts?.map((part: any, index: number) => {
          switch (part.type) {
            case 'text':
              return (
                <UserTextSection
                  key={`${messageId}-user-text-${index}`}
                  content={part.text}
                  messageId={messageId}
                  onUpdateMessage={onUpdateMessage}
                />
              )
            case 'file':
              return (
                <UserFileSection
                  key={`${messageId}-user-file-${index}`}
                  file={{
                    name: part.filename || 'Unknown file',
                    url: part.url,
                    contentType: part.mediaType
                  }}
                />
              )
            default:
              return null
          }
        })}
      </>
    )
  }

  // New rendering: interleave text parts with grouped non-text segments
  const elements: React.ReactNode[] = []
  let buffer: any[] = []
  const flushBuffer = (keySuffix: string) => {
    if (buffer.length === 0) return
    elements.push(
      <ResearchProcessSection
        key={`${messageId}-proc-${keySuffix}`}
        message={message}
        messageId={messageId}
        parts={buffer}
        getIsOpen={getIsOpen}
        onOpenChange={onOpenChange}
        onQuerySelect={onQuerySelect}
        status={status}
        addToolResult={addToolResult}
        suggestionMode={suggestionMode}
      />
    )
    buffer = []
  }

  message.parts?.forEach((part: any, index: number) => {
    if (part.type === 'text') {
      // Flush accumulated non-text first
      flushBuffer(`seg-${index}`)

      const remainingParts = message.parts?.slice(index + 1) || []
      const hasMoreTextParts = remainingParts.some(p => p.type === 'text')
      const isLastTextPart = !hasMoreTextParts
      const isStreamingComplete =
        status !== 'streaming' && status !== 'submitted'
      const shouldShowActions =
        isLastTextPart && (isLatestMessage ? isStreamingComplete : true)

      elements.push(
        <AnswerSection
          key={`${messageId}-text-${index}`}
          content={part.text}
          isOpen={getIsOpen(
            messageId,
            part.type,
            index < (message.parts?.length ?? 0) - 1
          )}
          onOpenChange={open => onOpenChange(messageId, open)}
          onHighlight={onHighlight}
          chatId={chatId}
          showActions={shouldShowActions}
          messageId={messageId}
          metadata={message.metadata as UIMessageMetadata | undefined}
          reload={reload}
          status={status}
          citationMaps={citationMaps}
          onSuggestionModeChange={handleSuggestionModeChange}
        />
      )
    } else if (
      part.type === 'reasoning' ||
      part.type?.startsWith?.('tool-') ||
      part.type?.startsWith?.('data-')
    ) {
      buffer.push(part)
    } else if (part.type === 'dynamic-tool') {
      flushBuffer(`seg-${index}`)
      elements.push(
        <DynamicToolDisplay
          key={`${messageId}-dynamic-tool-${index}`}
          part={part as DynamicToolPart}
        />
      )
    }
  })
  // Flush tail
  flushBuffer('tail')

  return <>{elements}</>
}
