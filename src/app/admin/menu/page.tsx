import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DeleteMenuItemButton from '@/components/admin/DeleteMenuItemButton'
import type { MenuItem } from '@/types'

const CATEGORY_LABEL: Record<string, string> = {
  event: 'Event/New', food: 'Food', signature: 'Signature',
  cocktail: 'Cocktail', beer: 'Beer', wine: 'Wine',
  whisky: 'Whisky', shochu: 'Shochu', spirits: 'Spirits',
}

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
          메뉴 아이템 ({items.length}개)
        </h2>
        <Link
          href="/admin/menu/new"
          className="text-xs px-3 py-1.5 rounded-lg"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          메뉴 추가
        </Link>
      </div>

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {items.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 메뉴가 없습니다.
          </p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{ backgroundColor: 'rgba(69,97,50,0.3)', color: '#9acd6a' }}
                  >
                    {CATEGORY_LABEL[item.category] ?? item.category}
                    {item.subcategory ? ` · ${item.subcategory}` : ''}
                  </span>
                  {!item.is_available && (
                    <span className="text-xs" style={{ color: 'rgba(239,68,68,0.7)' }}>품절</span>
                  )}
                </div>
                <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {item.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {item.price != null && `${item.price.toLocaleString()}원`}
                  {item.price_glass != null && `Glass ${item.price_glass.toLocaleString()}원`}
                  {item.price_bottle != null && ` / Bottle ${item.price_bottle.toLocaleString()}원`}
                </p>
              </div>
              <DeleteMenuItemButton itemId={item.id} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
