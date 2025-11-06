import { ModelMessage, UIMessageStreamWriter } from 'ai'

import { createActionItemsStream } from '@/lib/agents/generate-action-items'
import { generateId } from '@/lib/db/schema'
import { actionItemsSchema } from '@/lib/schema/related'

/**
 * Generates and streams action items if there are tool calls in the response
 */
export async function streamActionItems(
  writer: UIMessageStreamWriter,
  messages: ModelMessage[],
  abortSignal?: AbortSignal,
  parentTraceId?: string
): Promise<{
  actionItemsPartId?: string
  items?: Array<{ action: string }>
}> {
  // Check if the last message has tool calls
  const lastMessage = messages[messages.length - 1]
  if (!lastMessage || lastMessage.role !== 'assistant') {
    return {}
  }

  const actionItemsPartId = generateId()

  try {
    // Write loading state
    writer.write({
      type: 'data-actionItems',
      id: actionItemsPartId,
      data: { status: 'loading' }
    })

    const actionItemsResult = createActionItemsStream(
      messages,
      abortSignal,
      parentTraceId
    )

    const collectedItems: Array<{ action: string }> = []

    for await (const item of actionItemsResult.elementStream) {
      if (!item || typeof item.action !== 'string') {
        continue
      }

      collectedItems.push(item)

      writer.write({
        type: 'data-actionItems',
        id: actionItemsPartId,
        data: {
          status: 'streaming',
          items: [...collectedItems]
        }
      })
    }

    let finalItems = collectedItems

    try {
      const completedItems = await actionItemsResult.object
      const parsedItems = actionItemsSchema.safeParse(completedItems)

      if (parsedItems.success) {
        finalItems = parsedItems.data
      } else if (Array.isArray(completedItems)) {
        finalItems = completedItems
        console.warn('Action items validation failed:', parsedItems.error)
      }
    } catch (error) {
      console.warn('Error retrieving final action items object:', error)
    }

    writer.write({
      type: 'data-actionItems',
      id: actionItemsPartId,
      data: {
        status: 'success',
        items: finalItems
      }
    })

    return {
      actionItemsPartId,
      items: finalItems
    }
  } catch (error) {
    console.error('Error generating action items:', error)

    // Write error state
    writer.write({
      type: 'data-actionItems',
      id: actionItemsPartId,
      data: { status: 'error' }
    })

    return { actionItemsPartId }
  }
}
