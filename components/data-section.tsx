'use client'

import React from 'react'

import type { DataPart } from '@/lib/types/ai'

import { ActionItems } from './action-items'
import { RelatedQuestions } from './related-questions'

type SuggestionDisplayMode = 'related' | 'actions' | 'both'

interface DataSectionProps {
  part: DataPart
  onQuerySelect?: (query: string) => void
  suggestionMode?: SuggestionDisplayMode
}

export function DataSection({
  part,
  onQuerySelect,
  suggestionMode
}: DataSectionProps) {
  switch (part.type) {
    case 'data-actionItems':
      if (onQuerySelect) {
        return (
          <ActionItems
            data={part.data}
            onQuerySelect={onQuerySelect}
            showInBothMode={suggestionMode === 'both'}
          />
        )
      }
      return null

    case 'data-relatedQuestions':
      if (onQuerySelect) {
        return (
          <RelatedQuestions
            data={part.data}
            onQuerySelect={onQuerySelect}
            showInBothMode={suggestionMode === 'both'}
          />
        )
      }
      return null

    default:
      return null
  }
}
