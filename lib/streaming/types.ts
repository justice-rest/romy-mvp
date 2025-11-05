import { UIMessage } from '@ai-sdk/react'

import { ModelType } from '../types/model-type'
import { Model } from '../types/models'
import { SearchMode } from '../types/search'

export interface BaseStreamConfig {
  message: UIMessage | null
  model: Model
  chatId: string
  userId: string | null // null for guest users
  trigger?: 'submit-user-message' | 'regenerate-assistant-message'
  messageId?: string
  abortSignal?: AbortSignal
  isNewChat?: boolean
  searchMode?: SearchMode
  modelType?: ModelType
  promptEnhancement?: string | null
}
