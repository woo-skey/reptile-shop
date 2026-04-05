import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { MenuCategory } from '@/types'

type ReorderRow = { id: string; sort_order: number }

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

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

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
      errorResponse: NextResponse.json({ error: '관리자만 메뉴 순서를 변경할 수 있습니다.' }, { status: 403 }),
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

const parseReorderItems = (value: unknown): ReorderRow[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null

  const rows: ReorderRow[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') return null
    const id = toTrimmedString((raw as Record<string, unknown>).id)
    const sortValue = (raw as Record<string, unknown>).sort_order
    const sortOrder = typeof sortValue === 'number' ? Math.trunc(sortValue) : Number.parseInt(String(sortValue), 10)
    if (!id || Number.isNaN(sortOrder)) return null
    rows.push({ id, sort_order: sortOrder })
  }

  return rows
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json().catch(() => ({}))
  const category = toTrimmedString((body as Record<string, unknown>).category) as MenuCategory
  const items = parseReorderItems((body as Record<string, unknown>).items)

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: '잘못된 카테고리입니다.' }, { status: 400 })
  }

  if (!items) {
    return NextResponse.json({ error: '정렬할 메뉴 목록이 올바르지 않습니다.' }, { status: 400 })
  }

  const results = await Promise.all(
    items.map((row) =>
      admin.adminClient
        .from('menu_items')
        .update({ sort_order: row.sort_order })
        .eq('id', row.id)
        .eq('category', category)
    )
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
