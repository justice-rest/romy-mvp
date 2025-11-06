import { type ModelMessage, streamObject } from 'ai'

import { getRelatedQuestionsModel } from '../config/model-types'
import { actionItemSchema } from '../schema/related'
import { getModel } from '../utils/registry'
import { isTracingEnabled } from '../utils/telemetry'

import { ACTION_ITEMS_PROMPT } from './prompts/action-items-prompt'

export function createActionItemsStream(
  messages: ModelMessage[],
  abortSignal?: AbortSignal,
  parentTraceId?: string
) {
  // Use the same model configuration as related questions
  const relatedModel = getRelatedQuestionsModel()
  const modelId = `${relatedModel.providerId}:${relatedModel.id}`

  return streamObject({
    model: getModel(modelId),
    output: 'array',
    schema: actionItemSchema,
    schemaName: 'ActionItem',
    schemaDescription:
      'Generate a concise actionable next step (max 10-12 words)',
    system: ACTION_ITEMS_PROMPT,
    messages: [
      ...messages,
      {
        role: 'user',
        content:
          'Based on the conversation history and search results, generate 3 unique actionable next steps that would help the user move forward. Focus on practical actions they can take based on what was discussed.'
      }
    ],
    abortSignal,
    experimental_telemetry: {
      isEnabled: isTracingEnabled(),
      functionId: 'action-items',
      metadata: {
        modelId,
        agentType: 'action-items-generator',
        messageCount: messages.length,
        ...(parentTraceId && {
          langfuseTraceId: parentTraceId,
          langfuseUpdateParent: false
        })
      }
    }
  })
}
