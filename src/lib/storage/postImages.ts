import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const PUBLIC_MARKER = '/storage/v1/object/public/post-images/'
const SIGNED_MARKER = '/storage/v1/object/sign/post-images/'

export const extractPostImagePath = (rawValue: string): string | null => {
  const value = rawValue.trim()
  if (!value) return null

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const url = new URL(value)
      const pathname = url.pathname

      const publicIdx = pathname.indexOf(PUBLIC_MARKER)
      if (publicIdx >= 0) {
        return decodeURIComponent(pathname.slice(publicIdx + PUBLIC_MARKER.length))
      }

      const signedIdx = pathname.indexOf(SIGNED_MARKER)
      if (signedIdx >= 0) {
        return decodeURIComponent(pathname.slice(signedIdx + SIGNED_MARKER.length))
      }
    } catch {
      return null
    }

    return null
  }

  if (value.startsWith('/')) return null
  if (value.startsWith('post-images/')) return value.slice('post-images/'.length)
  return value
}

export const createPostImagesAdminClient = (): SupabaseClient | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

export const toRenderablePostImageUrl = async (
  rawValue: string | null | undefined,
  adminClient: SupabaseClient | null
) => {
  if (!rawValue) return null

  const value = rawValue.trim()
  if (!value) return null
  if (value.startsWith('/')) return value

  const path = extractPostImagePath(value)
  if (!path) return value
  if (!adminClient) return value

  const { data, error } = await adminClient.storage
    .from('post-images')
    .createSignedUrl(path, 60 * 60 * 24)

  if (error || !data?.signedUrl) return value
  return data.signedUrl
}
