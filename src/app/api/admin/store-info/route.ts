import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'
import { extractPostImagePath, toRenderablePostImageUrl } from '@/lib/storage/postImages'

const STORE_INFO_KEY = 'main'

const FIELDS = [
  'address',
  'phone',
  'business_hours',
  'closed_days',
  'instagram_url',
  'kakao_url',
  'map_url',
  'extra_note',
  'hero_image_url',
] as const

type StoreInfoField = typeof FIELDS[number]

const toNullableText = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const createAdminClient = (): SupabaseClient =>
  createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

async function assertAdmin() {
  const serverClient = await createServerClient()
  const { data: { user }, error: userError } = await serverClient.auth.getUser()
  if (userError || !user) {
    return { adminClient: null, errorResponse: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await serverClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return { adminClient: null, errorResponse: NextResponse.json({ error: profileError.message }, { status: 500 }) }
  }

  if (profile?.role !== 'admin') {
    return { adminClient: null, errorResponse: NextResponse.json({ error: '관리자만 매장 정보를 수정할 수 있습니다.' }, { status: 403 }) }
  }

  return { adminClient: createAdminClient(), errorResponse: null }
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json().catch(() => ({})) as Record<string, unknown>

  const updatePayload: Partial<Record<StoreInfoField, string | null>> = {}
  for (const field of FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updatePayload[field] = toNullableText(body[field])
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 })
  }

  let previousHero: string | null = null
  if (Object.prototype.hasOwnProperty.call(updatePayload, 'hero_image_url')) {
    const { data: current } = await admin.adminClient
      .from('store_info')
      .select('hero_image_url')
      .eq('key', STORE_INFO_KEY)
      .maybeSingle()
    previousHero = (current?.hero_image_url as string | null | undefined) ?? null
  }

  const { error } = await admin.adminClient
    .from('store_info')
    .upsert({ key: STORE_INFO_KEY, ...updatePayload }, { onConflict: 'key' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (previousHero && previousHero !== updatePayload.hero_image_url) {
    const path = extractPostImagePath(previousHero)
    if (path) {
      await admin.adminClient.storage.from('post-images').remove([path])
    }
  }

  revalidatePath('/')
  const heroImageUrl = Object.prototype.hasOwnProperty.call(updatePayload, 'hero_image_url')
    ? (updatePayload.hero_image_url ?? null)
    : previousHero
  const renderableHeroImageUrl = heroImageUrl
    ? await toRenderablePostImageUrl(heroImageUrl, admin.adminClient)
    : null

  return NextResponse.json({ success: true, heroImageUrl, renderableHeroImageUrl })
}
