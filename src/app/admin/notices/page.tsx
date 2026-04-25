import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeletePostButton from '@/components/community/DeletePostButton'
import ToggleNoticePinButton from '@/components/admin/ToggleNoticePinButton'
import type { Post } from '@/types'

export default async function AdminNoticesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, is_pinned, created_at')
    .eq('type', 'notice')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(500)

  const notices = (data ?? []) as unknown as Post[]

  return (
    <div>
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        공지 목록 ({notices.length}개)
      </h2>

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
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs hidden sm:inline" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {new Date(notice.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </span>
                <ToggleNoticePinButton postId={notice.id} initialPinned={notice.is_pinned} />
                <Link
                  href={`/notice/${notice.id}/edit`}
                  className="text-xs px-2.5 py-1 rounded-md border shrink-0"
                  style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
                >
                  수정
                </Link>
                <DeletePostButton postId={notice.id} redirectTo="/admin/notices" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
