const PUBLIC_MARKER = '/storage/v1/object/public/post-images/'
const SIGNED_MARKER = '/storage/v1/object/sign/post-images/'

export const toClientPostImageUrl = (rawValue: string | null | undefined) => {
  if (!rawValue) return null

  const value = rawValue.trim()
  if (!value) return null
  if (value.startsWith('/')) {
    return value
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (!baseUrl) return value

    try {
      const url = new URL(value)
      const pathname = url.pathname

      const publicIndex = pathname.indexOf(PUBLIC_MARKER)
      if (publicIndex >= 0) {
        const path = decodeURIComponent(pathname.slice(publicIndex + PUBLIC_MARKER.length))
        return `${baseUrl}/storage/v1/object/public/post-images/${path}`
      }

      const signedIndex = pathname.indexOf(SIGNED_MARKER)
      if (signedIndex >= 0) {
        const path = decodeURIComponent(pathname.slice(signedIndex + SIGNED_MARKER.length))
        return `${baseUrl}/storage/v1/object/public/post-images/${path}`
      }
    } catch {
      return value
    }

    return value
  }

  if (!baseUrl) return value

  const normalizedPath = value.startsWith('post-images/')
    ? value.slice('post-images/'.length)
    : value

  return `${baseUrl}/storage/v1/object/public/post-images/${normalizedPath}`
}
