import { getMediaAssets, getClient } from '@/lib/data'
import { MediaLibrary } from '@/components/media/media-library'

interface AssetsPageProps {
  params: Promise<{ clientId: string }>
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { clientId } = await params
  const [assets, client] = await Promise.all([
    getMediaAssets(clientId),
    getClient(clientId),
  ])

  const logoUrl = (client?.branding as Record<string, string> | null)?.logo_url || null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          Upload, organise and manage all your brand assets — images, videos, documents and more
        </p>
      </div>
      <MediaLibrary initialAssets={assets} clientId={clientId} clientLogoUrl={logoUrl} />
    </div>
  )
}
