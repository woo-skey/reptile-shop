import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/public-server'

type PostRow = {
  id: string
  type: 'community' | 'notice'
  updated_at: string
}

type EventRow = {
  created_at: string
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
const toAbsoluteUrl = (path: string) => new URL(path, `${baseUrl}/`).toString()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    {
      url: toAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: toAbsoluteUrl('/menu'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl('/event'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl('/community'),
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl('/notice'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  try {
    const supabase = createPublicClient()

    const [postsResult, eventsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('id, type, updated_at')
        .in('type', ['community', 'notice'])
        .order('updated_at', { ascending: false })
        .limit(2000),
      supabase
        .from('menu_items')
        .select('created_at')
        .eq('category', 'event_post')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    if (!postsResult.error) {
      const posts = (postsResult.data ?? []) as PostRow[]
      for (const post of posts) {
        const path = post.type === 'community' ? `/community/${post.id}` : `/notice/${post.id}`
        entries.push({
          url: toAbsoluteUrl(path),
          lastModified: new Date(post.updated_at),
          changeFrequency: post.type === 'community' ? 'hourly' : 'daily',
          priority: 0.6,
        })
      }
    }

    if (!eventsResult.error) {
      const latestEvent = (eventsResult.data?.[0] ?? null) as EventRow | null
      if (latestEvent?.created_at) {
        entries.push({
          url: toAbsoluteUrl('/event'),
          lastModified: new Date(latestEvent.created_at),
          changeFrequency: 'daily',
          priority: 0.9,
        })
      }
    }
  } catch {
    // Return static entries when DB fetch fails.
  }

  return entries
}
