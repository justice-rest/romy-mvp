import { UIMessage } from 'ai'

import { processFile } from '@/lib/utils/file-processor'

/**
 * Process file parts in messages to extract content from XLSX/CSV files.
 * For supported file types (XLSX, CSV), this helper fetches the file,
 * extracts its content as markdown tables, and replaces the file part
 * with a text part so the AI can analyze the data.
 * For images and PDFs, converts file parts to image parts for multimodal support.
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
                // Replace file part with extracted text content for XLSX/CSV
                newParts.push({
                  type: 'text' as const,
                  text: `Content from file "${filePart.filename || 'uploaded file'}":\n\n${content}`
                })
              } else if (filePart.mediaType.startsWith('image/') || filePart.mediaType === 'application/pdf') {
                // Convert file part to image part for images and PDFs
                newParts.push({
                  type: 'image' as const,
                  image: filePart.url,
                  mimeType: filePart.mediaType
                })
              } else {
                // Keep the original file part for other unsupported types
                newParts.push(part)
              }
            } catch (error) {
              console.error('Error processing file part:', error)
              // On error, keep the original file part
              newParts.push(part)
            }
          } else {
            newParts.push(part)
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
