import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import NoticeEditForm from '@/components/notice/NoticeEditForm'
import type { Post } from '@/types'

export default async function NoticeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: postData }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabase
      .from('posts')
      .select('id, title, content, is_pinned, type')
      .eq('id', id)
      .eq('type', 'notice')
      .maybeSingle(),
  ])

  if (!postData) notFound()
  if (profile?.role !== 'admin') redirect(`/notice/${id}`)

  const notice = postData as Pick<Post, 'id' | 'title' | 'content' | 'is_pinned'>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href={`/notice/${id}`}
        className="text-xs mb-6 inline-flex items-center gap-1"
        style={{ color: '#C9A227', opacity: 0.7 }}
      >
        ← 공지로 돌아가기
      </Link>

      <div className="glass-card p-5 sm:p-6">
        <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
          공지 수정
        </h1>
        <NoticeEditForm
          postId={notice.id}
          initialTitle={notice.title}
          initialContent={notice.content}
          initialIsPinned={notice.is_pinned}
        />
      </div>
    </div>
  )
}
