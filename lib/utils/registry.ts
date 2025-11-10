import { anthropic } from '@ai-sdk/anthropic'
import { createGateway } from '@ai-sdk/gateway'
import { google } from '@ai-sdk/google'
import { createOpenAI, openai } from '@ai-sdk/openai'
import { createProviderRegistry, LanguageModel } from 'ai'
import { createOllama } from 'ollama-ai-provider-v2'

// Build providers object conditionally
const providers: Record<string, any> = {
  openai,
  anthropic,
  google,
  perplexity: createOpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: 'https://api.perplexity.ai',
    fetch: async (input, init) => {
      const request = new Request(input, init)
      const requestUrl = new URL(request.url)

      if (requestUrl.pathname === '/responses') {
        requestUrl.pathname = '/chat/completions'
        // The Vercel AI SDK targets OpenAI's Responses API by default.
        // Perplexity's Sonar models only expose the Chat Completions
        // compatible surface, so we rewrite the request path to match.

        const clonedRequest = request.clone()
        const rewrittenRequestInit: RequestInit = {
          body: clonedRequest.body,
          headers: clonedRequest.headers,
          method: clonedRequest.method
        }

        if ('duplex' in clonedRequest) {
          ;(rewrittenRequestInit as Record<string, unknown>).duplex =
            (clonedRequest as unknown as { duplex?: string }).duplex
        }

        return fetch(new Request(requestUrl, rewrittenRequestInit))
      }

      return fetch(request)
    }
  }),
  'openai-compatible': createOpenAI({
    apiKey: process.env.OPENAI_COMPATIBLE_API_KEY,
    baseURL: process.env.OPENAI_COMPATIBLE_API_BASE_URL
  }),
  gateway: createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY
  })
}

// Only add Ollama if OLLAMA_BASE_URL is configured
if (process.env.OLLAMA_BASE_URL) {
  providers.ollama = createOllama({
    baseURL: `${process.env.OLLAMA_BASE_URL}/api`
  })
}

export const registry = createProviderRegistry(providers)

export function getModel(model: string): LanguageModel {
  return registry.languageModel(
    model as Parameters<typeof registry.languageModel>[0]
  )
}

export function isProviderEnabled(providerId: string): boolean {
  switch (providerId) {
    case 'openai':
      return !!process.env.OPENAI_API_KEY
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY
    case 'google':
      return !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
    case 'perplexity':
      return !!process.env.PERPLEXITY_API_KEY
    case 'openai-compatible':
      return (
        !!process.env.OPENAI_COMPATIBLE_API_KEY &&
        !!process.env.OPENAI_COMPATIBLE_API_BASE_URL
      )
    case 'gateway':
      return !!process.env.AI_GATEWAY_API_KEY
    case 'ollama':
      return !!process.env.OLLAMA_BASE_URL
    default:
      return false
  }
}
