import { createOpenAI } from '@ai-sdk/openai'

type CreatePerplexityOptions = Parameters<typeof createOpenAI>[0]

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>

const DEFAULT_BASE_URL = 'https://api.perplexity.ai'

function getFetchImplementation(
  providedFetch?: CreatePerplexityOptions['fetch']
): FetchImplementation {
  if (providedFetch) {
    return providedFetch
  }

  if (typeof fetch === 'function') {
    return fetch
  }

  throw new Error('Global fetch implementation is not available')
}

function rewriteToChatCompletions(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  baseUrl: URL
): Request {
  const request = new Request(input, init)
  const targetUrl = new URL(request.url)

  let rewrittenPath = targetUrl.pathname

  if (/\/v1\/responses$/.test(rewrittenPath)) {
    rewrittenPath = rewrittenPath.replace(
      /\/v1\/responses$/,
      '/chat/completions'
    )
  } else if (/\/responses$/.test(rewrittenPath)) {
    rewrittenPath = rewrittenPath.replace(/\/responses$/, '/chat/completions')
  }

  const shouldRewrite =
    targetUrl.origin === baseUrl.origin && targetUrl.pathname !== rewrittenPath

  if (!shouldRewrite) {
    return request
  }

  targetUrl.pathname = rewrittenPath

  const clonedRequest = request.clone()
  const rewrittenInit: RequestInit = {
    body: clonedRequest.body ?? undefined,
    cache: clonedRequest.cache,
    credentials: clonedRequest.credentials,
    headers: new Headers(clonedRequest.headers),
    integrity: clonedRequest.integrity,
    keepalive: clonedRequest.keepalive,
    method: clonedRequest.method,
    mode: clonedRequest.mode,
    redirect: clonedRequest.redirect,
    referrer: clonedRequest.referrer,
    referrerPolicy: clonedRequest.referrerPolicy,
    signal: clonedRequest.signal
  }

  if ('duplex' in clonedRequest) {
    ;(rewrittenInit as Record<string, unknown>).duplex = (
      clonedRequest as unknown as { duplex?: string }
    ).duplex
  }

  return new Request(targetUrl.toString(), rewrittenInit)
}

export function createPerplexity(options?: CreatePerplexityOptions) {
  const { fetch: providedFetch, baseURL, ...restOptions } = options ?? {}
  const resolvedBaseURL = baseURL ?? DEFAULT_BASE_URL
  const baseUrlObject = new URL(resolvedBaseURL)
  const fetchImpl = getFetchImplementation(providedFetch)

  return createOpenAI({
    ...restOptions,
    baseURL: resolvedBaseURL,
    fetch: async (input, init) => {
      const request = rewriteToChatCompletions(input, init, baseUrlObject)
      return fetchImpl(request)
    }
  })
}

export const perplexity = createPerplexity({
  apiKey: process.env.PERPLEXITY_API_KEY
})
