import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

const HOME_NOTICE_KEY = 'main'

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const isHomeNoticeTableMissingError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('home_notice_banner') && (
    normalized.includes('does not exist') ||
    normalized.includes('schema cache') ||
    normalized.includes('relation')
  )
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
      errorResponse: NextResponse.json({ error: '관리자만 메인 공지를 설정할 수 있습니다.' }, { status: 403 }),
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

const tableMissingResponse = NextResponse.json(
  { error: "home_notice_banner 테이블이 없습니다. sql/add_home_notice_banner.sql 을 먼저 실행해 주세요." },
  { status: 500 }
)

export async function PUT(request: NextRequest) {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const body = await request.json().catch(() => ({}))
  const title = toTrimmedString((body as Record<string, unknown>).title)
  const content = toTrimmedString((body as Record<string, unknown>).content)

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await admin.adminClient
    .from('home_notice_banner')
    .upsert(
      {
        key: HOME_NOTICE_KEY,
        title,
        content,
      },
      { onConflict: 'key' }
    )
    .select('key, title, content, created_at, updated_at')
    .single()

  if (error) {
    if (isHomeNoticeTableMissingError(error.message)) return tableMissingResponse
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, banner: data })
}

export async function DELETE() {
  const admin = await assertAdmin()
  if (admin.errorResponse) return admin.errorResponse

  const { error } = await admin.adminClient
    .from('home_notice_banner')
    .upsert(
      {
        key: HOME_NOTICE_KEY,
        title: '',
        content: '',
      },
      { onConflict: 'key' }
    )

  if (error) {
    if (isHomeNoticeTableMissingError(error.message)) return tableMissingResponse
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
