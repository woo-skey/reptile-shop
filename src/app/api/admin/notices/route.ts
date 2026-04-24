import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
    return NextResponse.json({ error: '관리자만 공지를 작성할 수 있습니다.' }, { status: 403 })
  }

  const body = await request.json()

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const isPinned = Boolean(body.isPinned)

  if (!title || !content) {
    return NextResponse.json({ error: '제목과 내용을 입력해주세요.' }, { status: 400 })
  }

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    type: 'notice',
    title,
    content,
    is_pinned: isPinned,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/')
  revalidatePath('/notice')

  return NextResponse.json({ success: true })
}
