import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import TogglePopupActiveButton from '@/components/admin/TogglePopupActiveButton'
import PopupEditModalButton from '@/components/admin/PopupEditModalButton'
import DeletePopupButton from '@/components/admin/DeletePopupButton'
import type { Popup } from '@/types'

export default async function AdminPopupPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('popups')
    .select('id, title, content, image_url, is_active, created_at')
    .order('created_at', { ascending: false })

  const popups = (data ?? []) as Popup[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          팝업 목록 ({popups.length}개)
        </h2>
        <Link
          href="/admin/popup/new"
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          팝업 생성
        </Link>
      </div>

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {popups.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 팝업이 없습니다.
          </p>
        ) : (
          popups.map((popup) => (
            <div key={popup.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: popup.is_active ? 'rgba(69, 97, 50, 0.3)' : 'rgba(239,68,68,0.15)',
                      color: popup.is_active ? '#9acd6a' : 'rgba(239,68,68,0.85)',
                    }}
                  >
                    {popup.is_active ? '활성' : '비활성'}
                  </span>
                  <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                    {popup.title}
                  </p>
                </div>

                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {popup.content ?? '(내용 없음)'}
                </p>

                <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.3 }}>
                  {new Date(popup.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <TogglePopupActiveButton popupId={popup.id} initialActive={popup.is_active} />
                <PopupEditModalButton popup={popup} />
                <DeletePopupButton popupId={popup.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
