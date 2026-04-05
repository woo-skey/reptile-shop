import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuCategory } from '@/types'

const VALID_CATEGORIES: MenuCategory[] = [
  'event',
  'event_post',
  'food',
  'non_alcohol',
  'beverage',
  'signature',
  'cocktail',
  'beer',
  'wine',
  'whisky',
  'shochu',
  'spirits',
]

const WINE_SUBS = new Set(['red', 'white', 'sparkling'])
const WHISKY_SUBS = new Set(['single_malt', 'blended', 'bourbon', 'tennessee'])

const isImageColumnMissingError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('image_url') && (
    normalized.includes('schema cache') ||
    normalized.includes('column') ||
    normalized.includes('menu_items.image_url')
  )
}

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const toNullableText = (value: unknown) => {
  const text = toTrimmedString(value)
  return text.length > 0 ? text : null
}

const toNullableCocktailPrice = (value: unknown) => {
  const text = toTrimmedString(value)
  if (!text) return null

  const numericText = text.replace(/,/g, '').match(/\d+/)?.[0]
  if (!numericText) return null

  const parsed = Number.parseInt(numericText, 10)
  if (Number.isNaN(parsed)) return null

  return String(parsed)
}

const toNullableNumber = (value: unknown, integer = false) => {
  if (value == null) return null

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    return integer ? Math.trunc(value) : value
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim()
    if (!normalized) return null

    const parsed = Number(normalized)
    if (!Number.isFinite(parsed)) return null

    return integer ? Math.trunc(parsed) : parsed
  }

  return null
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
      errorResponse: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }),
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
      errorResponse: NextResponse.json({ error: '관리자만 메뉴를 관리할 수 있습니다.' }, { status: 403 }),
    }
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return {
      adminClient: null,
      errorResponse: NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 }),
    }
  }

  return { adminClient, errorResponse: null }
}

const parseMenuPayload = (body: Record<string, unknown>) => {
  const category = body.category as MenuCategory
  if (!VALID_CATEGORIES.includes(category)) {
    return { error: '잘못된 카테고리입니다.', payload: null }
  }

  const name = toTrimmedString(body.name)
  if (!name) {
    return { error: '메뉴 이름을 입력해주세요.', payload: null }
  }

  let subcategory = category === 'cocktail'
    ? toNullableCocktailPrice(body.subcategory)
    : toNullableText(body.subcategory)
  if (category === 'cocktail' && !subcategory) {
    const fallbackTier = toNullableNumber(body.price, true)
    if (fallbackTier != null) {
      subcategory = String(fallbackTier)
    }
  }

  if (category === 'cocktail' && !subcategory) {
    return { error: '칵테일은 가격(원)을 입력해주세요.', payload: null }
  }

  if (category === 'wine' && subcategory && !WINE_SUBS.has(subcategory)) {
    return { error: 'wine 서브카테고리가 올바르지 않습니다.', payload: null }
  }

  if (category === 'whisky' && subcategory && !WHISKY_SUBS.has(subcategory)) {
    return { error: 'whisky 서브카테고리가 올바르지 않습니다.', payload: null }
  }

  const payload: Record<string, unknown> = {
    category,
    subcategory,
    name,
    description: toNullableText(body.description),
    note: toNullableText(body.note),
    abv: toNullableNumber(body.abv),
    volume_ml: toNullableNumber(body.volume_ml, true),
    price: toNullableNumber(body.price, true),
    price_glass: toNullableNumber(body.price_glass, true),
    price_bottle: toNullableNumber(body.price_bottle, true),
    sort_order: toNullableNumber(body.sort_order, true) ?? 0,
    is_available: typeof body.is_available === 'boolean' ? body.is_available : true,
  }

  if (category === 'cocktail') {
    payload.price = null
  }

  // 이미지 삭제를 지원하기 위해 image_url 키가 오면 null도 포함해서 반영한다.
  if (Object.prototype.hasOwnProperty.call(body, 'image_url')) {
    payload.image_url = toNullableText(body.image_url)
  }

  return { error: null, payload }
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json()
  const { error: payloadError, payload } = parseMenuPayload(body as Record<string, unknown>)

  if (payloadError || !payload) {
    return NextResponse.json({ error: payloadError ?? '잘못된 요청입니다.' }, { status: 400 })
  }

  let {
    data: insertedItem,
    error,
  } = await admin.adminClient
    .from('menu_items')
    .insert(payload)
    .select('*')
    .single()

  if (error && isImageColumnMissingError(error.message) && Object.prototype.hasOwnProperty.call(payload, 'image_url')) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.image_url

    const retry = await admin.adminClient
      .from('menu_items')
      .insert(fallbackPayload)
      .select('*')
      .single()
    insertedItem = retry.data
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, item: insertedItem })
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json()
  const id = toTrimmedString(body.id)

  if (!id) {
    return NextResponse.json({ error: '수정할 메뉴 ID가 필요합니다.' }, { status: 400 })
  }

  const { error: payloadError, payload } = parseMenuPayload(body as Record<string, unknown>)
  if (payloadError || !payload) {
    return NextResponse.json({ error: payloadError ?? '잘못된 요청입니다.' }, { status: 400 })
  }

  let { error } = await admin.adminClient
    .from('menu_items')
    .update(payload)
    .eq('id', id)

  if (error && isImageColumnMissingError(error.message) && Object.prototype.hasOwnProperty.call(payload, 'image_url')) {
    const fallbackPayload = { ...payload }
    delete fallbackPayload.image_url

    const retry = await admin.adminClient
      .from('menu_items')
      .update(fallbackPayload)
      .eq('id', id)
    error = retry.error
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json().catch(() => ({}))
  const id = toTrimmedString((body as Record<string, unknown>).id)

  if (!id) {
    return NextResponse.json({ error: '삭제할 메뉴 ID가 필요합니다.' }, { status: 400 })
  }

  const { error } = await admin.adminClient
    .from('menu_items')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
