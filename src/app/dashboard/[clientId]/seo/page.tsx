import { getKeywords } from '@/lib/data'
import { KeywordsList } from '@/components/content/keywords-list'


interface SeoPageProps {
  params: Promise<{ clientId: string }>
}

export default async function SeoPage({ params }: SeoPageProps) {
  const { clientId } = await params
  const keywords = await getKeywords(clientId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">SEO & Keywords</h1>
        <p className="text-muted-foreground">
          Keyword research from DataForSEO — volume, difficulty, intent, and content mapping
        </p>
      </div>
      <KeywordsList keywords={keywords} />
    </div>
  )
}
