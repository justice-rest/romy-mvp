'use client'

import React from 'react'

import { ArrowRight } from 'lucide-react'

import type { ActionItemsData } from '@/lib/types/ai'

import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { CollapsibleMessage } from './collapsible-message'
import { Section } from './section'

interface ActionItemsProps {
  data: ActionItemsData
  onQuerySelect: (query: string) => void
  showInBothMode?: boolean
}

export const ActionItems: React.FC<ActionItemsProps> = ({
  data,
  onQuerySelect,
  showInBothMode = false
}) => {
  if (showInBothMode) {
    return (
      <div className="pt-0 pb-4">
        <h2 className="flex items-center leading-none py-2 text-sm">
          <span className="mr-1.5 text-muted-foreground">Action</span>
        </h2>
        <div className="flex flex-col gap-2">
          {data.status === 'streaming' && data.items && (
            <>
              {data.items.map((item, index) => (
                <div className="flex items-start w-full" key={index}>
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Button
                    variant="link"
                    className="flex-1 justify-start px-0 py-0 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
                    type="submit"
                    name={'action_item'}
                    value={item.action}
                    onClick={() => onQuerySelect(item.action)}
                  >
                    {item.action}
                  </Button>
                </div>
              ))}
              {Array.from({
                length: Math.max(0, 3 - data.items.length)
              }).map((_, index) => (
                <div
                  className="flex items-start w-full"
                  key={`placeholder-${index}`}
                >
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </>
          )}

          {data.status === 'loading' && (
            <>
              {[1, 2, 3].map((_, index) => (
                <div className="flex items-start w-full" key={index}>
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </>
          )}

          {data.status === 'error' && (
            <div className="text-sm text-muted-foreground">
              Failed to generate action items
            </div>
          )}

          {data.status === 'success' && data.items && (
            <>
              {data.items.map((item, index) => (
                <div className="flex items-start w-full" key={index}>
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Button
                    variant="link"
                    className="flex-1 justify-start px-0 py-0 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
                    type="submit"
                    name={'action_item'}
                    value={item.action}
                    onClick={() => onQuerySelect(item.action)}
                  >
                    {item.action}
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    )
  }
  const renderActionButtons = (items: Array<{ action: string }>) =>
    items.map((item, index) => (
      <div className="flex items-start w-full" key={index}>
        <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
        <Button
          variant="link"
          className="flex-1 justify-start px-0 py-0 h-fit font-semibold text-accent-foreground/50 whitespace-normal text-left"
          type="submit"
          name={'action_item'}
          value={item.action}
          onClick={() => onQuerySelect(item.action)}
        >
          {item.action}
        </Button>
      </div>
    ))

  return (
    <CollapsibleMessage
      role="assistant"
      isCollapsible={false}
      isOpen={true}
      onOpenChange={() => {}}
      showIcon={false}
      showBorder={false}
    >
      <Section title="Action" className="pt-0 pb-4">
        <div className="flex flex-col gap-2">
          {data.status === 'streaming' && data.items && (
            <>
              {renderActionButtons(data.items)}
              {Array.from({
                length: Math.max(0, 3 - data.items.length)
              }).map((_, index) => (
                <div
                  className="flex items-start w-full"
                  key={`placeholder-${index}`}
                >
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </>
          )}

          {data.status === 'loading' && (
            <>
              {[1, 2, 3].map((_, index) => (
                <div className="flex items-start w-full" key={index}>
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 shrink-0 text-accent-foreground/50" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </>
          )}

          {data.status === 'error' && (
            <div className="text-sm text-muted-foreground">
              Failed to generate action items
            </div>
          )}

          {data.status === 'success' && data.items && (
            <>{renderActionButtons(data.items)}</>
          )}
        </div>
      </Section>
    </CollapsibleMessage>
  )
}

export default ActionItems
