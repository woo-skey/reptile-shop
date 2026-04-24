import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const toNullableText = (value: unknown) => {
  const text = toTrimmedString(value)
  return text.length > 0 ? text : null
}

const toNullableImageUrl = (value: unknown) => {
  const url = toTrimmedString(value)
  if (!url) return null

  const isAbsoluteHttp = /^https?:\/\//i.test(url)
  const isRootRelative = url.startsWith('/')
  if (!isAbsoluteHttp && !isRootRelative) return null

  return url
}

const createAdminClient = (): SupabaseClient | null => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) return null

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function assertAdmin() {
  const serverClient = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser()

  if (userError || !user) {
    return {
      adminClient: null,
      errorResponse: NextResponse.json({ error: 'Login required.' }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await serverClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {
      adminClient: null,
      errorResponse: NextResponse.json({ error: profileError.message }, { status: 500 }),
    }
  }

  if (profile?.role !== 'admin') {
    return {
      adminClient: null,
      errorResponse: NextResponse.json({ error: 'Admin only.' }, { status: 403 }),
    }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return {
      adminClient: null,
      errorResponse: NextResponse.json({ error: 'Server env is invalid.' }, { status: 500 }),
    }
  }

  return { adminClient, errorResponse: null }
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json().catch(() => ({}))

  const title = toTrimmedString((body as Record<string, unknown>).title)
  const content = toNullableText((body as Record<string, unknown>).content)
  const imageUrl = toNullableImageUrl((body as Record<string, unknown>).image_url)
  const isActiveRaw = (body as Record<string, unknown>).is_active
  const isActive = typeof isActiveRaw === 'boolean' ? isActiveRaw : true

  if (!title) {
    return NextResponse.json({ error: 'Popup title is required.' }, { status: 400 })
  }

  if (title.length > 120) {
    return NextResponse.json({ error: 'Popup title must be 120 chars or less.' }, { status: 400 })
  }

  const { data, error } = await admin.adminClient
    .from('popups')
    .insert({
      title,
      content,
      image_url: imageUrl,
      is_active: isActive,
    })
    .select('id, title, content, image_url, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/')
  return NextResponse.json({ success: true, popup: data })
}
