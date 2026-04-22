import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminMenuItemManager from '@/components/admin/AdminMenuItemManager'
import type { MenuItem } from '@/types'

export default async function AdminMenuPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('sort_order')

  const items = (data ?? []) as MenuItem[]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          메뉴/이벤트 아이템 ({items.length}개)
        </h2>
        <Link
          href="/admin/menu/new"
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          메뉴 추가
        </Link>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
        이벤트 탭, 메뉴의 Event / New 탭, 일반 메뉴를 이 페이지에서 바로 수정/삭제할 수 있습니다.
      </p>

      <AdminMenuItemManager initialItems={items} />
    </div>
  )
}
