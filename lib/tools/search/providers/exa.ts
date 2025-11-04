import Exa from 'exa-js'

import { SearchResultImage, SearchResults } from '@/lib/types'
import { cleanTitle, deduplicateByDomainAndUrl, sanitizeUrl } from '@/lib/utils'

import { BaseSearchProvider } from './base'

export class ExaSearchProvider extends BaseSearchProvider {
  async search(
    query: string,
    maxResults: number = 10,
    searchDepth: 'basic' | 'advanced' = 'basic',
    includeDomains: string[] = [],
    excludeDomains: string[] = [],
    options?: {
      type?: 'general' | 'optimized'
      content_types?: Array<'web' | 'video' | 'image' | 'news'>
    }
  ): Promise<SearchResults> {
    const apiKey = process.env.EXA_API_KEY
    this.validateApiKey(apiKey, 'EXA')

    try {
      const exa = new Exa(apiKey)

      // Determine search type and category based on options
      const isNews = options?.content_types?.includes('news') || false
      const quality =
        searchDepth === 'advanced' ? 'best' : 'default'

      // Configure Exa search options similar to scira implementation
      const searchOptions: any = {
        text: true,
        type: quality === 'best' ? 'hybrid' : 'auto',
        numResults: maxResults < 10 ? 10 : maxResults,
        livecrawl: 'preferred',
        useAutoprompt: true,
        category: isNews ? 'news' : '',
      }

      // Add domain filters if provided
      if (includeDomains.length > 0) {
        searchOptions.includeDomains = includeDomains
      }
      if (excludeDomains.length > 0) {
        searchOptions.excludeDomains = excludeDomains
      }

      const data = await exa.searchAndContents(query, searchOptions)

      // Collect images from results
      const collectedImages: { url: string; description: string }[] = []

      const results = data.results.map((result: any) => {
        // Extract images from results
        if (result.image) {
          collectedImages.push({
            url: result.image,
            description: cleanTitle(
              result.title ||
                result.text?.substring(0, 100) + '...' ||
                ''
            ),
          })
        }

        return {
          url: result.url,
          title: cleanTitle(result.title || ''),
          content: (result.text || result.highlight || '').substring(0, 1000),
        }
      })

      // Apply deduplication to results and images
      const deduplicatedResults = deduplicateByDomainAndUrl(results)
      const deduplicatedImages = deduplicateByDomainAndUrl(collectedImages)

      // Format images as SearchResultImage type
      const processedImages: SearchResultImage[] = deduplicatedImages
        .filter((img) => img.url && img.description)
        .map((img) => ({
          url: sanitizeUrl(img.url),
          description: img.description,
        }))

      return {
        results: deduplicatedResults,
        query,
        images: processedImages,
        number_of_results: deduplicatedResults.length,
      }
    } catch (error) {
      console.error(`Exa search error for query "${query}":`, error)
      throw error instanceof Error
        ? error
        : new Error('Exa search failed')
    }
  }
}
