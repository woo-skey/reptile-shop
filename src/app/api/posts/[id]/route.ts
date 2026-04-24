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
      .select('id, author_id, image_urls')
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

  const imagePaths = Array.isArray(post.image_urls)
    ? post.image_urls.filter((path): path is string => typeof path === 'string' && path.length > 0)
    : []
  if (imagePaths.length > 0) {
    await adminClient.storage.from('post-images').remove(imagePaths)
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const postId = id?.trim()

  if (!postId) {
    return NextResponse.json({ error: '수정할 게시글 ID가 필요합니다.' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))
  const hasTitle = Object.prototype.hasOwnProperty.call(body, 'title')
  const hasContent = Object.prototype.hasOwnProperty.call(body, 'content')
  const hasIsPinned = Object.prototype.hasOwnProperty.call(body, 'is_pinned')
  const title = hasTitle && typeof body.title === 'string' ? body.title.trim() : ''
  const content = hasContent && typeof body.content === 'string' ? body.content.trim() : ''
  const isPinned = hasIsPinned ? Boolean(body.is_pinned) : null

  if (hasTitle && !title) {
    return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 })
  }
  if (hasContent && !content) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }
  if (!hasTitle && !hasContent && !hasIsPinned) {
    return NextResponse.json({ error: '수정할 항목이 없습니다.' }, { status: 400 })
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
      .select('id, author_id, type')
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

  if (post.type === 'notice') {
    if (!isAdmin) {
      return NextResponse.json({ error: '공지는 관리자만 수정할 수 있습니다.' }, { status: 403 })
    }
  } else if (post.type === 'community') {
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })
    }
    if (hasIsPinned) {
      return NextResponse.json({ error: '커뮤니티 게시글은 고정할 수 없습니다.' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: '지원하지 않는 게시글 유형입니다.' }, { status: 400 })
  }

  const adminClient = createAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: '서버 설정이 올바르지 않습니다.' }, { status: 500 })
  }

  const updatePayload: Record<string, unknown> = {}
  if (hasTitle) updatePayload.title = title
  if (hasContent) updatePayload.content = content
  if (hasIsPinned) updatePayload.is_pinned = isPinned

  const { error: updateError } = await adminClient
    .from('posts')
    .update(updatePayload)
    .eq('id', postId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
