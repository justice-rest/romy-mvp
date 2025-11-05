import { UIMessage } from 'ai'

import { processFile } from '@/lib/utils/file-processor'

/**
 * Process file parts in messages to extract content from XLSX/CSV files.
 * For supported file types (XLSX, CSV), this helper fetches the file,
 * extracts its content as markdown tables, and adds it as a text part
 * following the file part so the AI can analyze the data.
 *
 * @param messages - Array of UI messages from the chat history
 * @returns Messages with processed file content
 */
export async function processFileParts(
  messages: UIMessage[]
): Promise<UIMessage[]> {
  const processedMessages = await Promise.all(
    messages.map(async msg => {
      if (msg.parts && Array.isArray(msg.parts)) {
        const newParts: any[] = []

        for (const part of msg.parts) {
          newParts.push(part)

          if (part.type === 'file') {
            const filePart = part as {
              type: 'file'
              url: string
              mediaType: string
              filename?: string
            }

            try {
              const content = await processFile(
                filePart.url,
                filePart.mediaType
              )

              if (content) {
                newParts.push({
                  type: 'text' as const,
                  text: `\n\nContent from file "${filePart.filename || 'uploaded file'}":\n\n${content}`
                })
              }
            } catch (error) {
              console.error('Error processing file part:', error)
            }
          }
        }

        return {
          ...msg,
          parts: newParts
        }
      }
      return msg
    })
  )

  return processedMessages
}
