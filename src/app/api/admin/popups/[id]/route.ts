import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { extractPostImagePath } from '@/lib/storage/postImages'

const removePostImageByUrl = async (client: SupabaseClient, url: string | null | undefined) => {
  if (!url) return
  const path = extractPostImagePath(url)
  if (!path) return
  await client.storage.from('post-images').remove([path])
}

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const { id } = await params
  const popupId = toTrimmedString(id)
  if (!popupId) {
    return NextResponse.json({ error: 'Popup id is required.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>

  const updatePayload: Record<string, unknown> = {}

  if (Object.prototype.hasOwnProperty.call(body, 'title')) {
    const title = toTrimmedString(body.title)
    if (!title) {
      return NextResponse.json({ error: 'Popup title is required.' }, { status: 400 })
    }
    if (title.length > 120) {
      return NextResponse.json({ error: 'Popup title must be 120 chars or less.' }, { status: 400 })
    }
    updatePayload.title = title
  }

  if (Object.prototype.hasOwnProperty.call(body, 'content')) {
    updatePayload.content = toNullableText(body.content)
  }

  if (Object.prototype.hasOwnProperty.call(body, 'image_url')) {
    updatePayload.image_url = toNullableImageUrl(body.image_url)
  }

  if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be boolean.' }, { status: 400 })
    }
    updatePayload.is_active = body.is_active
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
  }

  let previousImageUrl: string | null = null
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'image_url')) {
    const { data: current } = await admin.adminClient
      .from('popups')
      .select('image_url')
      .eq('id', popupId)
      .maybeSingle()
    previousImageUrl = (current?.image_url as string | null | undefined) ?? null
  }

  const { data, error } = await admin.adminClient
    .from('popups')
    .update(updatePayload)
    .eq('id', popupId)
    .select('id, title, content, image_url, is_active, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (previousImageUrl && previousImageUrl !== updatePayload.image_url) {
    await removePostImageByUrl(admin.adminClient, previousImageUrl)
  }

  revalidatePath('/')
  return NextResponse.json({ success: true, popup: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const { id } = await params
  const popupId = toTrimmedString(id)
  if (!popupId) {
    return NextResponse.json({ error: 'Popup id is required.' }, { status: 400 })
  }

  const { data: existing } = await admin.adminClient
    .from('popups')
    .select('image_url')
    .eq('id', popupId)
    .maybeSingle()

  const { error } = await admin.adminClient
    .from('popups')
    .delete()
    .eq('id', popupId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await removePostImageByUrl(admin.adminClient, (existing?.image_url as string | null | undefined) ?? null)

  revalidatePath('/')
  return NextResponse.json({ success: true })
}
