import { z } from 'zod'

export const relatedQuestionSchema = z.object({
  question: z.string()
})

export const relatedSchema = z.array(relatedQuestionSchema).length(3)

export type RelatedQuestion = z.infer<typeof relatedQuestionSchema>
export type Related = z.infer<typeof relatedSchema>

export const actionItemSchema = z.object({
  action: z.string()
})

export const actionItemsSchema = z.array(actionItemSchema).length(3)

export type ActionItem = z.infer<typeof actionItemSchema>
export type ActionItems = z.infer<typeof actionItemsSchema>
