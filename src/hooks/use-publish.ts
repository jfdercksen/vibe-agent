'use client'

import { useState } from 'react'

interface PublishOptions {
  type: 'social' | 'blog' | 'email'
  postId: string
  clientId: string
  platform?: string
}

export function usePublish() {
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publish = async ({ type, postId, clientId, platform }: PublishOptions) => {
    setIsPublishing(true)
    setError(null)

    try {
      const response = await fetch(`/api/publish/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, clientId, platform }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Publishing failed')
      }

      return await response.json()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Publishing failed'
      setError(message)
      throw err
    } finally {
      setIsPublishing(false)
    }
  }

  return { publish, isPublishing, error }
}
