import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env'

const DISPLAY_NAME_MAX = 20

export async function PATCH(request: NextRequest) {
  const serverClient = await createServerClient()
  const { data: { user }, error: userError } = await serverClient.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  const raw = typeof body.display_name === 'string' ? body.display_name.trim() : ''

  if (!raw) {
    return NextResponse.json({ error: '이름을 입력해주세요.' }, { status: 400 })
  }
  if (raw.length > DISPLAY_NAME_MAX) {
    return NextResponse.json({ error: `이름은 ${DISPLAY_NAME_MAX}자 이하로 입력해주세요.` }, { status: 400 })
  }

  const adminClient = createSupabaseClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await adminClient
    .from('profiles')
    .update({ display_name: raw })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, display_name: raw })
}
