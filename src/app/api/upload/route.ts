import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

const getFileExtension = (filename: string) => {
  const index = filename.lastIndexOf('.')
  if (index < 0) return ''
  return filename.slice(index).toLowerCase()
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const filename = typeof body.filename === 'string' ? body.filename.trim() : ''
  const contentType = typeof body.contentType === 'string' ? body.contentType.trim().toLowerCase() : ''
  const fileSize = toNumber(body.fileSize)

  if (!filename || !contentType || fileSize == null) {
    return NextResponse.json({ error: 'filename, contentType, and fileSize are required.' }, { status: 400 })
  }

  if (filename.length > 180) {
    return NextResponse.json({ error: 'Filename is too long.' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(contentType)) {
    return NextResponse.json({ error: 'Unsupported image type.' }, { status: 400 })
  }

  const extension = getFileExtension(filename)
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json({ error: 'Unsupported file extension.' }, { status: 400 })
  }

  if (fileSize <= 0 || fileSize > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File size must be between 1 byte and ${MAX_UPLOAD_SIZE_BYTES} bytes.` },
      { status: 400 }
    )
  }

  const adminClient = createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey())

  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${user.id}/${Date.now()}_${safeFilename}`

  const { data, error } = await adminClient.storage
    .from('post-images')
    .createSignedUploadUrl(path)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path })
}
