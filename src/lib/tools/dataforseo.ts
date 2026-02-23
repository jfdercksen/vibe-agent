// DataForSEO MCP Bridge — server-side only

export interface KeywordData {
  keyword: string
  searchVolume: number
  cpc: number
  competition: number
  difficulty: 'low' | 'medium' | 'high'
  intent: 'informational' | 'transactional' | 'navigational' | 'commercial'
  trend: number[]
}

export interface SerpResult {
  keyword: string
  results: Array<{
    position: number
    url: string
    title: string
    description: string
    domain: string
  }>
}

function getAuthHeader(): string {
  const username = process.env.DATAFORSEO_USERNAME
  const password = process.env.DATAFORSEO_PASSWORD
  if (!username || !password) throw new Error('DataForSEO credentials not configured')
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
}

export async function getKeywordData(
  keywords: string[],
  locationCode = 2840, // US
  languageCode = 'en'
): Promise<KeywordData[]> {
  const response = await fetch(
    'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keywords,
          location_code: locationCode,
          language_code: languageCode,
        },
      ]),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DataForSEO keywords error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const results = data?.tasks?.[0]?.result || []

  return results.map((item: Record<string, unknown>) => ({
    keyword: item.keyword as string,
    searchVolume: (item.search_volume as number) || 0,
    cpc: (item.cpc as number) || 0,
    competition: (item.competition as number) || 0,
    difficulty: getDifficultyLabel((item.keyword_difficulty as number) || 0),
    intent: mapIntent((item.search_intent as string) || 'informational'),
    trend: (item.monthly_searches as Array<Record<string, number>> || []).map(m => m.search_volume || 0),
  }))
}

export async function getSerpResults(
  keyword: string,
  locationCode = 2840,
  languageCode = 'en',
  depth = 10
): Promise<SerpResult> {
  const response = await fetch(
    'https://api.dataforseo.com/v3/serp/google/organic/live/advanced',
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keyword,
          location_code: locationCode,
          language_code: languageCode,
          depth,
          se_domain: 'google.com',
        },
      ]),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DataForSEO SERP error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const items = data?.tasks?.[0]?.result?.[0]?.items || []

  return {
    keyword,
    results: items
      .filter((item: Record<string, unknown>) => item.type === 'organic')
      .map((item: Record<string, unknown>) => ({
        position: item.rank_absolute as number,
        url: item.url as string,
        title: item.title as string,
        description: item.description as string,
        domain: item.domain as string,
      })),
  }
}

export async function getKeywordSuggestions(
  seed: string,
  locationCode = 2840,
  limit = 20
): Promise<KeywordData[]> {
  const response = await fetch(
    'https://api.dataforseo.com/v3/dataforseo_labs/google/related_keywords/live',
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          keyword: seed,
          location_code: locationCode,
          language_code: 'en',
          limit,
          include_seed_keyword: true,
        },
      ]),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DataForSEO suggestions error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  const items = data?.tasks?.[0]?.result?.[0]?.items || []

  return items.map((item: Record<string, unknown>) => {
    const kd = item.keyword_data as Record<string, unknown> || {}
    const ms = kd.keyword_info as Record<string, unknown> || {}
    return {
      keyword: item.keyword as string,
      searchVolume: (ms.search_volume as number) || 0,
      cpc: (ms.cpc as number) || 0,
      competition: (ms.competition as number) || 0,
      difficulty: getDifficultyLabel((kd.keyword_properties as Record<string, number>)?.keyword_difficulty || 0),
      intent: mapIntent((kd.search_intent_info as Record<string, string>)?.main_intent || 'informational'),
      trend: [],
    }
  })
}

function getDifficultyLabel(score: number): 'low' | 'medium' | 'high' {
  if (score <= 30) return 'low'
  if (score <= 60) return 'medium'
  return 'high'
}

function mapIntent(intent: string): 'informational' | 'transactional' | 'navigational' | 'commercial' {
  const map: Record<string, 'informational' | 'transactional' | 'navigational' | 'commercial'> = {
    informational: 'informational',
    transactional: 'transactional',
    navigational: 'navigational',
    commercial: 'commercial',
    investigate: 'commercial',
  }
  return map[intent.toLowerCase()] || 'informational'
}
