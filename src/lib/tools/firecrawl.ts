// Firecrawl MCP Bridge — server-side only
// Replaces the CLI Firecrawl MCP for web app context

export interface FirecrawlScrapeResult {
  url: string
  title: string
  markdown: string
  html?: string
  metadata: {
    description?: string
    ogImage?: string
    wordCount: number
  }
}

export interface FirecrawlCrawlResult {
  baseUrl: string
  pagesScraped: number
  pages: FirecrawlScrapeResult[]
}

export async function firecrawlScrape(url: string, includeHtml = false): Promise<FirecrawlScrapeResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured')

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: includeHtml ? ['markdown', 'html'] : ['markdown'],
      onlyMainContent: true,
      waitFor: 1000,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Firecrawl scrape error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const content = data.data

  return {
    url,
    title: content?.metadata?.title || url,
    markdown: content?.markdown || '',
    html: content?.html,
    metadata: {
      description: content?.metadata?.description,
      ogImage: content?.metadata?.ogImage,
      wordCount: (content?.markdown || '').split(/\s+/).length,
    },
  }
}

export async function firecrawlCrawl(
  baseUrl: string,
  maxPages = 10,
  includePaths?: string[]
): Promise<FirecrawlCrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) throw new Error('FIRECRAWL_API_KEY not configured')

  // Start crawl job
  const startResponse = await fetch('https://api.firecrawl.dev/v1/crawl', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: baseUrl,
      limit: maxPages,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
      ...(includePaths ? { includePaths } : {}),
    }),
  })

  if (!startResponse.ok) {
    const err = await startResponse.text()
    throw new Error(`Firecrawl crawl error: ${startResponse.status} — ${err}`)
  }

  const { id: crawlId } = await startResponse.json()

  // Poll for completion (max 60 seconds)
  const maxAttempts = 12
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000))

    const statusResponse = await fetch(`https://api.firecrawl.dev/v1/crawl/${crawlId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      const pages = (statusData.data || []).map((page: Record<string, unknown>) => {
        const meta = (page.metadata as Record<string, unknown>) || {}
        return {
          url: (meta.sourceURL as string) || baseUrl,
          title: (meta.title as string) || '',
          markdown: (page.markdown as string) || '',
          metadata: {
            description: meta.description as string | undefined,
            wordCount: ((page.markdown as string) || '').split(/\s+/).length,
          },
        }
      })

      return {
        baseUrl,
        pagesScraped: pages.length,
        pages,
      }
    }

    if (statusData.status === 'failed') {
      throw new Error(`Firecrawl crawl failed: ${statusData.error}`)
    }
  }

  throw new Error('Firecrawl crawl timed out after 60 seconds')
}
