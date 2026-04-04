import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MenuCategory } from '@/types'

const VALID_CATEGORIES: MenuCategory[] = [
  'event',
  'food',
  'signature',
  'cocktail',
  'beer',
  'wine',
  'whisky',
  'shochu',
  'spirits',
]

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '관리자만 메뉴를 추가할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json()

  const category = body.category as MenuCategory
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: '잘못된 카테고리입니다.' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: '메뉴 이름을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabase.from('menu_items').insert({
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
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
