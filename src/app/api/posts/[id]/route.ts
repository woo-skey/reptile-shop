import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = id?.trim()

  if (!postId) {
    return NextResponse.json({ error: '삭제할 게시글 ID가 필요합니다.' }, { status: 400 })
  }

  const serverClient = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await serverClient.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const [{ data: profile, error: profileError }, { data: post, error: postError }] = await Promise.all([
    serverClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(),
    serverClient
      .from('posts')
      .select('id, author_id')
      .eq('id', postId)
      .maybeSingle(),
  ])

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (postError) {
    return NextResponse.json({ error: postError.message }, { status: 500 })
  }

  if (!post) {
    return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  }

  const isAdmin = profile?.role === 'admin'
  const isOwner = post.author_id === user.id
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 })
  }

  const { error: deleteError } = await adminClient
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
