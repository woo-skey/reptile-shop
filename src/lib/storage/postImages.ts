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

// Batch variant: signs many paths in a single Supabase request instead of N.
// Returns an array aligned to the input — entries that don't need signing
// (null, local paths, external URLs) are passed through unchanged.
export const toRenderablePostImageUrlsBatch = async (
  rawValues: Array<string | null | undefined>,
  adminClient: SupabaseClient | null
): Promise<Array<string | null>> => {
  const resolved: Array<string | null> = new Array(rawValues.length).fill(null)
  const pathsToSign: string[] = []
  const pathIndexByValue = new Map<number, string>()

  for (let i = 0; i < rawValues.length; i++) {
    const raw = rawValues[i]
    if (!raw) {
      resolved[i] = null
      continue
    }
    const value = raw.trim()
    if (!value) {
      resolved[i] = null
      continue
    }
    if (value.startsWith('/')) {
      resolved[i] = value
      continue
    }
    const path = extractPostImagePath(value)
    if (!path || !adminClient) {
      resolved[i] = value
      continue
    }
    resolved[i] = value
    pathIndexByValue.set(i, path)
    pathsToSign.push(path)
  }

  if (!adminClient || pathsToSign.length === 0) return resolved

  const { data, error } = await adminClient.storage
    .from('post-images')
    .createSignedUrls(pathsToSign, 60 * 60 * 24)

  if (error || !data) return resolved

  const signedByPath = new Map<string, string>()
  for (const entry of data) {
    if (entry.path && entry.signedUrl) signedByPath.set(entry.path, entry.signedUrl)
  }

  for (const [index, path] of pathIndexByValue.entries()) {
    const signed = signedByPath.get(path)
    if (signed) resolved[index] = signed
  }

  return resolved
}
