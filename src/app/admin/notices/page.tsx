import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeletePostButton from '@/components/community/DeletePostButton'
import type { Post } from '@/types'

export default async function AdminNoticesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, is_pinned, created_at')
    .eq('type', 'notice')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const notices = (data ?? []) as unknown as Post[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          공지 목록 ({notices.length}개)
        </h2>
        <Link
          href="/admin/notices/new"
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          공지 작성
        </Link>
      </div>

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {notices.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 공지가 없습니다.
          </p>
        ) : (
          notices.map((notice) => (
            <div key={notice.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="flex items-center gap-2 min-w-0">
                {notice.is_pinned && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: 'rgba(201, 162, 39, 0.15)', color: '#C9A227' }}
                  >
                    고정
                  </span>
                )}
                <Link
                  href={`/notice/${notice.id}`}
                  className="text-sm truncate hover:underline"
                  style={{ color: 'var(--foreground)' }}
                >
                  {notice.title}
                </Link>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {new Date(notice.created_at).toLocaleDateString('ko-KR')}
                </span>
                <DeletePostButton postId={notice.id} redirectTo="/admin/notices" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}