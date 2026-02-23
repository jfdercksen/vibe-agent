import { getBrandVoice, getPositioningAngles, getClient } from '@/lib/data'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RealtimeRefresh } from '@/components/content/realtime-refresh'
import {
  Compass, Mic, Star, Shield, Target, AlertTriangle, CheckCircle2,
  Building2, Globe, Users, Palette, MessageSquare, BookOpen,
  ThumbsUp, ThumbsDown, Hash, ExternalLink, Layers
} from 'lucide-react'

interface StrategyPageProps {
  params: Promise<{ clientId: string }>
}

export default async function StrategyPage({ params }: StrategyPageProps) {
  const { clientId } = await params
  const [client, brandVoice, angles] = await Promise.all([
    getClient(clientId),
    getBrandVoice(clientId),
    getPositioningAngles(clientId),
  ])

  if (!client) notFound()

  const hasFoundation = brandVoice || angles.length > 0

  return (
    <div className="space-y-10">
      <RealtimeRefresh table="brand_voices" clientId={clientId} />
      <RealtimeRefresh table="positioning_angles" clientId={clientId} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Foundation</h1>
          <p className="text-muted-foreground">
            Everything Claude knows about {client.display_name || client.name} — voice, positioning, and identity
          </p>
        </div>
        {hasFoundation
          ? <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 shrink-0">✓ Foundation complete</Badge>
          : <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 shrink-0">Foundation not built yet</Badge>
        }
      </div>

      {/* CLIENT PROFILE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Client Profile</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Business Type</CardTitle></CardHeader>
            <CardContent>
              {client.business_type
                ? <Badge variant="secondary" className="capitalize">{client.business_type.replace(/_/g, ' ')}</Badge>
                : <p className="text-sm text-muted-foreground">Not set</p>}
              {client.industry && <p className="text-sm mt-2 text-muted-foreground">{client.industry}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Website</CardTitle></CardHeader>
            <CardContent>
              {client.website
                ? <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1 break-all">
                    {client.website.replace(/^https?:\/\//,'')}<ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                : <p className="text-sm text-muted-foreground">Not set</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />Target Audience</CardTitle></CardHeader>
            <CardContent>
              {client.target_audience
                ? <p className="text-sm">{client.target_audience}</p>
                : <p className="text-sm text-muted-foreground">Not defined</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Target className="h-3.5 w-3.5" />Primary Goal</CardTitle></CardHeader>
            <CardContent>
              {client.primary_goal
                ? <p className="text-sm">{client.primary_goal}</p>
                : <p className="text-sm text-muted-foreground">Not defined</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-1.5"><Palette className="h-4 w-4 text-primary" />Brand Colours</CardTitle></CardHeader>
            <CardContent>
              {client.branding && (client.branding.primaryColor || client.branding.secondaryColor) ? (
                <div className="flex items-center gap-4 flex-wrap">
                  {client.branding.primaryColor && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border shadow-sm" style={{ backgroundColor: client.branding.primaryColor }} />
                      <div><p className="text-xs font-medium">Primary</p><p className="text-xs text-muted-foreground">{client.branding.primaryColor}</p></div>
                    </div>
                  )}
                  {client.branding.secondaryColor && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border shadow-sm" style={{ backgroundColor: client.branding.secondaryColor }} />
                      <div><p className="text-xs font-medium">Secondary</p><p className="text-xs text-muted-foreground">{client.branding.secondaryColor}</p></div>
                    </div>
                  )}
                  {client.branding.fonts && client.branding.fonts.length > 0 && (
                    <div><p className="text-xs font-medium">Fonts</p><p className="text-xs text-muted-foreground">{client.branding.fonts.join(', ')}</p></div>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground">No branding defined yet</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-1.5"><Layers className="h-4 w-4 text-primary" />Competitors</CardTitle></CardHeader>
            <CardContent>
              {client.competitors && client.competitors.length > 0
                ? <div className="flex flex-wrap gap-2">{client.competitors.map((c, i) => <Badge key={i} variant="outline" className="text-xs">{typeof c === 'string' ? c : JSON.stringify(c)}</Badge>)}</div>
                : <p className="text-sm text-muted-foreground">No competitors tracked yet</p>}
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* BRAND VOICE */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Brand Voice</h2>
          {brandVoice && <Badge variant="outline" className="text-green-600 border-green-300">Active</Badge>}
        </div>

        {brandVoice ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Hash className="h-4 w-4 text-primary" />Personality Traits</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.personality_traits.map((t) => <Badge key={t} variant="secondary" className="text-sm">{t}</Badge>)}
                    {brandVoice.personality_traits.length === 0 && <p className="text-sm text-muted-foreground">Not defined yet</p>}
                  </div>
                </CardContent>
              </Card>

              {Object.keys(brandVoice.voice_dimensions).length > 0 && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">Voice Dimensions</CardTitle><CardDescription>How the brand communicates on each axis (1–10)</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(brandVoice.voice_dimensions).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{value}/10</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary" style={{ width: `${(Number(value) / 10) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ThumbsUp className="h-4 w-4 text-green-600" />Words to Use</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.vocabulary_embrace.map((w) => <Badge key={w} className="bg-green-100 text-green-700 hover:bg-green-100">{w}</Badge>)}
                    {brandVoice.vocabulary_embrace.length === 0 && <p className="text-sm text-muted-foreground">Not defined yet</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-red-600" />Words to Avoid</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {brandVoice.vocabulary_avoid.map((w) => <Badge key={w} className="bg-red-100 text-red-700 hover:bg-red-100">{w}</Badge>)}
                    {brandVoice.vocabulary_avoid.length === 0 && <p className="text-sm text-muted-foreground">Not defined yet</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {(brandVoice.sample_on_brand.length > 0 || brandVoice.sample_off_brand.length > 0) && (
              <div className="grid gap-4 lg:grid-cols-2">
                {brandVoice.sample_on_brand.length > 0 && (
                  <Card className="border-green-200">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" />On-Brand Examples</CardTitle><CardDescription>This is how we sound</CardDescription></CardHeader>
                    <CardContent className="space-y-2">
                      {brandVoice.sample_on_brand.map((s, i) => <div key={i} className="bg-green-50 rounded-md p-3 text-sm border border-green-100 italic">&ldquo;{s}&rdquo;</div>)}
                    </CardContent>
                  </Card>
                )}
                {brandVoice.sample_off_brand.length > 0 && (
                  <Card className="border-red-200">
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-600" />Off-Brand Examples</CardTitle><CardDescription>We never sound like this</CardDescription></CardHeader>
                    <CardContent className="space-y-2">
                      {brandVoice.sample_off_brand.map((s, i) => <div key={i} className="bg-red-50 rounded-md p-3 text-sm border border-red-100 italic">&ldquo;{s}&rdquo;</div>)}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {Object.keys(brandVoice.channel_notes).length > 0 && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Channel Notes</CardTitle><CardDescription>How the voice adapts per platform</CardDescription></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(brandVoice.channel_notes).map(([ch, note]) => (
                      <div key={ch} className="bg-muted/50 rounded-lg p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide mb-1 capitalize">{ch}</p>
                        <p className="text-sm text-muted-foreground">{note}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              {brandVoice.anti_positioning && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-amber-600" />Anti-Positioning</CardTitle><CardDescription>What this brand is NOT</CardDescription></CardHeader>
                  <CardContent><p className="text-sm">{brandVoice.anti_positioning}</p></CardContent>
                </Card>
              )}
              {brandVoice.full_document && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Full Brand Voice Document</CardTitle></CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">{brandVoice.full_document}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card className="py-8 text-center border-dashed">
            <CardContent>
              <Mic className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium mb-1">No brand voice yet</p>
              <p className="text-sm text-muted-foreground">Go to Chat → Prompt Library → Foundation → <strong>Build brand voice</strong></p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      {/* POSITIONING ANGLES */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Positioning Angles</h2>
          {angles.length > 0 && <Badge variant="outline">{angles.length} angle{angles.length !== 1 ? 's' : ''}</Badge>}
        </div>

        {angles.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {angles.map((angle) => (
              <Card key={angle.id} className={angle.is_selected ? 'border-primary ring-1 ring-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {angle.angle_number && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{angle.angle_number}</span>
                      )}
                      {angle.framework && <Badge variant="outline" className="text-xs">{angle.framework.replace(/_/g, ' ')}</Badge>}
                    </div>
                    {angle.is_selected && <Badge className="bg-primary text-primary-foreground shrink-0"><Star className="mr-1 h-3 w-3" />Selected</Badge>}
                  </div>
                  <CardTitle className="text-base leading-snug">{angle.core_hook}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {angle.psychology && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Psychology</p>
                      <p className="text-sm">{angle.psychology}</p>
                    </div>
                  )}
                  {angle.headline_directions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Headline Directions</p>
                      <ul className="space-y-1">
                        {angle.headline_directions.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-2"><Target className="h-3 w-3 mt-1 text-primary shrink-0" />{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {angle.anti_angle && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Anti-Angle</p>
                      <p className="text-sm text-muted-foreground">{angle.anti_angle}</p>
                    </div>
                  )}
                  {angle.risk && (
                    <div className="flex items-start gap-2 bg-amber-50 rounded-md p-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">{angle.risk}</p>
                    </div>
                  )}
                  {Object.keys(angle.score).length > 0 && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t">
                      {Object.entries(angle.score).map(([k, v]) => (
                        <span key={k} className="text-xs text-muted-foreground capitalize">{k.replace(/_/g, ' ')}: <strong className="text-foreground">{v}/10</strong></span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="py-8 text-center border-dashed">
            <CardContent>
              <Compass className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium mb-1">No positioning angles yet</p>
              <p className="text-sm text-muted-foreground">Go to Chat → Prompt Library → Foundation → <strong>Positioning angles</strong></p>
            </CardContent>
          </Card>
        )}
      </section>

      {!hasFoundation && (
        <>
          <Separator />
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-1">Build your foundation first</p>
                  <p className="text-sm text-muted-foreground mb-3">Head to Chat and use the Orchestrator to start — it will run market research, build your brand voice, and define your positioning angles step by step.</p>
                  <div className="flex flex-wrap gap-2">
                    {['🎯 Orchestrator → Where do I start?', '🏗️ Build brand voice', '🏗️ Positioning angles'].map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}