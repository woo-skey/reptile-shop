import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeletePostButton from '@/components/community/DeletePostButton'
import type { Post, Profile } from '@/types'

export const revalidate = 60

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('*, profiles(display_name, username)')
    .eq('id', id)
    .eq('type', 'notice')
    .single()

  if (!data) notFound()

  const notice = data as unknown as Post & { profiles: Pick<Profile, 'display_name' | 'username'> }
  const authorName = notice.profiles?.display_name ?? notice.profiles?.username ?? '알 수 없음'

  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/notice"
        className="text-xs mb-6 inline-flex items-center gap-1"
        style={{ color: '#C9A227', opacity: 0.7 }}
      >
        ← 공지 목록
      </Link>

      <article className="glass-card px-6 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            {notice.is_pinned && (
              <span
                className="text-xs px-1.5 py-0.5 rounded mb-2 inline-block"
                style={{ backgroundColor: 'rgba(201, 162, 39, 0.15)', color: '#C9A227' }}
              >
                고정
              </span>
            )}
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
              {notice.title}
            </h1>
            <div className="flex items-center gap-2 text-xs mt-2" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              <span>{authorName}</span>
              <span>·</span>
              <span>{new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/notice/${notice.id}/edit`}
                className="text-xs px-3 py-1.5 rounded-md border"
                style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
              >
                수정
              </Link>
              <DeletePostButton postId={notice.id} redirectTo="/notice" />
            </div>
          )}
        </div>

        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--foreground)', opacity: 0.8 }}
        >
          {notice.content}
        </div>
      </article>
    </div>
  )
}
