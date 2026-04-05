import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MenuCategory } from '@/types'

const VALID_CATEGORIES: MenuCategory[] = [
  'event',
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

async function assertAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { errorResponse: NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return { errorResponse: NextResponse.json({ error: '관리자만 메뉴를 관리할 수 있습니다.' }, { status: 403 }) }
  }

  return { supabase, errorResponse: null }
}

const parseMenuPayload = (body: Record<string, unknown>) => {
  const category = body.category as MenuCategory
  if (!VALID_CATEGORIES.includes(category)) {
    return { error: '잘못된 카테고리입니다.', payload: null }
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return { error: '메뉴 이름을 입력해주세요.', payload: null }
  }

  const imageUrl = typeof body.image_url === 'string' ? body.image_url.trim() : ''

  const payload: Record<string, unknown> = {
    category,
    subcategory: body.subcategory ?? null,
    name,
    description: body.description ?? null,
    note: body.note ?? null,
    abv: body.abv ?? null,
    volume_ml: body.volume_ml ?? null,
    price: body.price ?? null,
    price_glass: body.price_glass ?? null,
    price_bottle: body.price_bottle ?? null,
    sort_order: body.sort_order ?? 0,
    is_available: body.is_available ?? true,
    image_url: imageUrl || null,
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

  const { error } = await admin.supabase.from('menu_items').insert(payload)

  if (error) {
    if (error.message.includes('menu_items.image_url')) {
      return NextResponse.json(
        {
          error:
            '메뉴 사진 저장 컬럼이 아직 없습니다. SQL Editor에서 image_url 컬럼 추가 SQL을 먼저 실행해주세요.',
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json()
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) {
    return NextResponse.json({ error: '수정할 메뉴 ID가 필요합니다.' }, { status: 400 })
  }

  const { error: payloadError, payload } = parseMenuPayload(body as Record<string, unknown>)
  if (payloadError || !payload) {
    return NextResponse.json({ error: payloadError ?? '잘못된 요청입니다.' }, { status: 400 })
  }

  const { error } = await admin.supabase
    .from('menu_items')
    .update(payload)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
