import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/public-server'
import NoticeCreateLink from '@/components/notice/NoticeCreateLink'
import type { Post } from '@/types'

export default async function NoticePage() {
  const supabase = createPublicClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at, is_pinned, profiles(display_name)')
    .eq('type', 'notice')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const notices = (data ?? []) as unknown as Post[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}>
            공지사항
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            파충류가게 공지입니다.
          </p>
        </div>
        <NoticeCreateLink />
      </div>

      {notices.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 공지가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <Link
              key={notice.id}
              href={`/notice/${notice.id}`}
              className="glass-card block px-5 py-4 transition-all hover:border-[rgba(201,162,39,0.4)]"
            >
              <div className="flex items-center gap-2 mb-1">
                {notice.is_pinned && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(201, 162, 39, 0.15)', color: '#C9A227' }}
                  >
                    고정
                  </span>
                )}
                <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                  {notice.title}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs mt-1.5" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                <span>{(notice.profiles as unknown as { display_name: string })?.display_name}</span>
                <span>·</span>
                <span>{new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
