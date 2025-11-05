'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Textarea from 'react-textarea-autosize'
import { useRouter } from 'next/navigation'

import { UseChatHelpers } from '@ai-sdk/react'
import { ArrowUp, ChevronDown, MessageCirclePlus, Square } from 'lucide-react'
import { toast } from 'sonner'

import { DATA_TYPE_CONFIGS } from '@/lib/config/research-types'
import { UploadedFile } from '@/lib/types'
import type { UIDataTypes, UIMessage, UITools } from '@/lib/types/ai'
import { cn } from '@/lib/utils'

import { useAuthCheck } from '@/hooks/use-auth-check'

import { useArtifact } from './artifact/artifact-context'
import { Button } from './ui/button'
import { ActionButtons, ActionButtonsHandle } from './action-buttons'
import { FileUploadButton } from './file-upload-button'
import { SearchModeSelector } from './search-mode-selector'
import { UploadedFileList } from './uploaded-file-list'

// Constants for timing delays
const INPUT_UPDATE_DELAY_MS = 10 // Delay to ensure input value is updated before form submission

interface ChatPanelProps {
  chatId: string
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  status: UseChatHelpers<UIMessage<unknown, UIDataTypes, UITools>>['status']
  messages: UIMessage[]
  setMessages: (messages: UIMessage[]) => void
  query?: string
  stop: () => void
  append: (message: any) => void
  /** Whether to show the scroll to bottom button */
  showScrollToBottomButton: boolean
  /** Reference to the scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  /** Callback to reset chatId when starting a new chat */
  onNewChat?: () => void
}

export function ChatPanel({
  chatId,
  input,
  handleInputChange,
  handleSubmit,
  status,
  messages,
  setMessages,
  query,
  stop,
  append,
  showScrollToBottomButton,
  uploadedFiles,
  setUploadedFiles,
  scrollContainerRef,
  onNewChat
}: ChatPanelProps) {
  const router = useRouter()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const actionButtonsRef = useRef<ActionButtonsHandle>(null)
  const isFirstRender = useRef(true)
  const [isComposing, setIsComposing] = useState(false) // Composition state
  const [enterDisabled, setEnterDisabled] = useState(false) // Disable Enter after composition ends
  const [isInputFocused, setIsInputFocused] = useState(false) // Track input focus
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>([])
  const { close: closeArtifact } = useArtifact()
  const { isAuthenticated } = useAuthCheck()
  const isLoading = status === 'submitted' || status === 'streaming'

  const handleCompositionStart = () => setIsComposing(true)

  const handleCompositionEnd = () => {
    setIsComposing(false)
    setEnterDisabled(true)
    setTimeout(() => {
      setEnterDisabled(false)
    }, 300)
  }

  const handleNewChat = () => {
    setMessages([])
    closeArtifact()
    // Reset focus state when clearing chat
    setIsInputFocused(false)
    inputRef.current?.blur()
    // Reset chatId in parent component
    onNewChat?.()
    router.push('/')
  }

  const isToolInvocationInProgress = () => {
    if (!messages.length) return false

    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== 'assistant' || !lastMessage.parts) return false

    const parts = lastMessage.parts
    const lastPart = parts[parts.length - 1]

    return (
      (lastPart?.type === 'tool-search' ||
        lastPart?.type === 'tool-fetch' ||
        lastPart?.type === 'tool-askQuestion') &&
      ((lastPart as any)?.state === 'input-streaming' ||
        (lastPart as any)?.state === 'input-available')
    )
  }

  // if query is not empty, submit the query
  useEffect(() => {
    if (isFirstRender.current && query && query.trim().length > 0) {
      append({
        role: 'user',
        content: query
      })
      isFirstRender.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleFileRemove = useCallback(
    (index: number) => {
      setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    },
    [setUploadedFiles]
  )
  // Scroll to the bottom of the container
  const handleScrollToBottom = () => {
    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      {uploadedFiles.length > 0 && (
        <UploadedFileList files={uploadedFiles} onRemove={handleFileRemove} />
      )}
      <form
        onSubmit={e => {
          if (selectedDataTypes.length > 0) {
            const dataTypeEnhancements = selectedDataTypes
              .map(dt => DATA_TYPE_CONFIGS.find(config => config.value === dt)?.promptEnhancement)
              .filter(Boolean)
              .join('\n\n')
            
            if (dataTypeEnhancements && typeof window !== 'undefined') {
              sessionStorage.setItem('promptEnhancement', dataTypeEnhancements)
            }
          }
          handleSubmit(e)
          setIsInputFocused(false)
          inputRef.current?.blur()
        }}
        className="max-w-3xl w-full mx-auto relative"
      >
        {/* Scroll to bottom button - only shown when showScrollToBottomButton is true */}
        {showScrollToBottomButton && messages.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute -top-10 right-4 z-20 size-8 rounded-full shadow-md"
            onClick={handleScrollToBottom}
            title="Scroll to bottom"
          >
            <ChevronDown size={16} />
          </Button>
        )}

        <div className="relative">
          {/* Subtle shadow effect like scira */}
          <div className="absolute -inset-1 rounded-2xl bg-primary/5 dark:bg-primary/2 blur-sm pointer-events-none" />
          
          <div
            className={cn(
              'relative rounded-xl bg-muted border-0 focus-within:border-ring/50 transition-all duration-200',
              isInputFocused && 'ring-1 ring-ring/20'
            )}
          >
            <Textarea
              ref={inputRef}
              name="input"
              rows={1}
              minRows={1}
              maxRows={8}
              tabIndex={0}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Ask anything..."
              spellCheck={false}
              value={input}
              disabled={isLoading || isToolInvocationInProgress()}
              className="resize-none w-full bg-transparent border-0 px-4 py-4 text-base leading-relaxed placeholder:text-muted-foreground focus-visible:outline-hidden focus:ring-0 focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl rounded-b-none"
              onChange={handleInputChange}
              onKeyDown={e => {
                if (
                  e.key === 'Enter' &&
                  !e.shiftKey &&
                  !isComposing &&
                  !enterDisabled
                ) {
                  if (input.trim().length === 0) {
                    e.preventDefault()
                    return
                  }
                  e.preventDefault()
                  const textarea = e.target as HTMLTextAreaElement
                  textarea.form?.requestSubmit()
                  // Reset focus state after Enter key submission
                  setIsInputFocused(false)
                  textarea.blur()
                }
              }}
              style={{
                resize: 'none'
              }}
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between p-2 gap-2 rounded-t-none rounded-b-xl bg-muted">
              <div className="flex items-center gap-2">
                {isAuthenticated && (
                  <FileUploadButton
                    onFileSelect={async files => {
                      const newFiles: UploadedFile[] = files.map(file => ({
                        file,
                        status: 'uploading'
                      }))
                      setUploadedFiles(prev => [...prev, ...newFiles])
                      await Promise.all(
                        newFiles.map(async uf => {
                          const formData = new FormData()
                          formData.append('file', uf.file)
                          formData.append('chatId', chatId)
                          try {
                            const res = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData
                            })

                            if (!res.ok) {
                              throw new Error('Upload failed')
                            }

                            const { file: uploaded } = await res.json()
                            setUploadedFiles(prev =>
                              prev.map(f =>
                                f.file === uf.file
                                  ? {
                                      ...f,
                                      status: 'uploaded',
                                      url: uploaded.url,
                                      name: uploaded.filename,
                                      key: uploaded.key
                                    }
                                  : f
                              )
                            )
                          } catch (e) {
                            toast.error(`Failed to upload ${uf.file.name}`)
                            setUploadedFiles(prev =>
                              prev.map(f =>
                                f.file === uf.file ? { ...f, status: 'error' } : f
                              )
                            )
                          }
                        })
                      )
                    }}
                  />
                )}
                <SearchModeSelector
                  onResearchTypeClick={category => {
                    // Map category label to action button key (lowercase)
                    const categoryKey = category.toLowerCase()
                    // Trigger ActionButtons to show prompt samples
                    if (actionButtonsRef.current && messages.length === 0) {
                      actionButtonsRef.current.setActiveCategory(categoryKey)
                    }
                    // Set the category in the input
                    handleInputChange({
                      target: { value: category }
                    } as React.ChangeEvent<HTMLTextAreaElement>)
                    // Focus the input
                    inputRef.current?.focus()
                  }}
                  onDataTypesChange={(dataTypes) => {
                    setSelectedDataTypes(dataTypes)
                  }}
                />
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {messages.length > 0 && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNewChat}
                    className="shrink-0 rounded-full group size-8 border-0 shadow-none hover:bg-primary/30"
                    type="button"
                    disabled={isLoading}
                  >
                    <MessageCirclePlus className="size-4 group-hover:rotate-12 transition-all" />
                  </Button>
                )}
                <Button
                  type={isLoading ? 'button' : 'submit'}
                  size={'icon'}
                  className={cn(
                    isLoading && 'animate-pulse',
                    'rounded-full size-8 shadow-none'
                  )}
                  disabled={input.length === 0 && !isLoading}
                  onClick={isLoading ? stop : undefined}
                >
                  {isLoading ? <Square size={16} /> : <ArrowUp size={16} />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {messages.length === 0 && (
          <ActionButtons
            ref={actionButtonsRef}
            onSelectPrompt={message => {
              handleInputChange({
                target: { value: message }
              } as React.ChangeEvent<HTMLTextAreaElement>)
              setTimeout(() => {
                inputRef.current?.form?.requestSubmit()
                setIsInputFocused(false)
                inputRef.current?.blur()
              }, INPUT_UPDATE_DELAY_MS)
            }}
            onCategoryClick={category => {
              handleInputChange({
                target: { value: category }
              } as React.ChangeEvent<HTMLTextAreaElement>)
              inputRef.current?.focus()
            }}
            inputRef={inputRef}
            className="mt-2 [&_>div>div:first-child]:hidden"
          />
        )}
      </form>
    </>
  )
}
