// Perplexity MCP Bridge — server-side only
// Replaces the CLI Perplexity MCP for web app context

export interface PerplexityResult {
  query: string
  answer: string
  sources: Array<{ title: string; url: string; snippet: string }>
  model: string
}

export async function perplexitySearch(
  query: string,
  focus: 'web' | 'news' | 'finance' | 'academic' = 'web'
): Promise<PerplexityResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY
  if (!apiKey) throw new Error('PERPLEXITY_API_KEY not configured')

  const modelMap = {
    web: 'sonar',
    news: 'sonar',
    finance: 'sonar-pro',
    academic: 'sonar-pro',
  }

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelMap[focus],
      messages: [
        {
          role: 'system',
          content: 'You are a marketing research assistant. Provide detailed, actionable insights with specific data points, statistics, and examples. Always cite your sources.',
        },
        {
          role: 'user',
          content: query,
        },
      ],
      max_tokens: 2000,
      return_citations: true,
      search_recency_filter: focus === 'news' ? 'week' : 'month',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Perplexity API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message

  return {
    query,
    answer: message?.content || '',
    sources: (message?.citations || []).map((url: string, i: number) => ({
      title: `Source ${i + 1}`,
      url,
      snippet: '',
    })),
    model: data.model || modelMap[focus],
  }
}
