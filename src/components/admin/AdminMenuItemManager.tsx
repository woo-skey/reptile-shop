'use client'

import { useEffect, useMemo, useState } from 'react'
import DeleteMenuItemButton from '@/components/admin/DeleteMenuItemButton'
import EventEditModalButton from '@/components/event/EventEditModalButton'
import MenuEditModalButton from '@/components/menu/MenuEditModalButton'
import type { MenuItem } from '@/types'

const CATEGORY_LABEL: Record<string, string> = {
  event_post: '이벤트 탭',
  event: 'Event / New',
  food: 'Food',
  non_alcohol: 'Non-Alcohol',
  beverage: 'Beverage',
  signature: 'Signature',
  cocktail: 'Cocktail',
  beer: 'Beer',
  wine: 'Wine',
  whisky: 'Whisky',
  shochu: 'Shochu',
  spirits: 'Spirits',
}

const formatPrice = (item: MenuItem) => {
  if (item.price != null) return `${item.price.toLocaleString()}원`

  const parts: string[] = []
  if (item.price_glass != null) parts.push(`Glass ${item.price_glass.toLocaleString()}원`)
  if (item.price_bottle != null) parts.push(`Bottle ${item.price_bottle.toLocaleString()}원`)
  return parts.join(' / ')
}

type Section = {
  key: 'event_post' | 'event' | 'menu'
  title: string
  description: string
  items: MenuItem[]
}

export default function AdminMenuItemManager({ initialItems }: { initialItems: MenuItem[] }) {
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const handleItemUpdated = (updated: MenuItem) => {
    setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemDeleted = (deletedId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== deletedId))
  }

  const sections = useMemo<Section[]>(
    () => [
      {
        key: 'event_post',
        title: '이벤트 탭 항목',
        description: '이벤트 페이지에 노출되는 항목입니다.',
        items: items.filter((item) => item.category === 'event_post'),
      },
      {
        key: 'event',
        title: '메뉴 Event / New 항목',
        description: '메뉴 페이지의 Event / New 탭에 노출되는 항목입니다.',
        items: items.filter((item) => item.category === 'event'),
      },
      {
        key: 'menu',
        title: '일반 메뉴 항목',
        description: '음식과 주류 메뉴 전체입니다.',
        items: items.filter((item) => item.category !== 'event' && item.category !== 'event_post'),
      },
    ],
    [items]
  )

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <section key={section.key}>
          <div className="mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {section.title} ({section.items.length}개)
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              {section.description}
            </p>
          </div>

          <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
            {section.items.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                등록된 항목이 없습니다.
              </p>
            ) : (
              section.items.map((item) => {
                const priceLabel = formatPrice(item)
                const isEventPost = item.category === 'event_post'

                return (
                  <div key={item.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span
                          className="text-xs px-1.5 py-0.5 rounded shrink-0"
                          style={{ backgroundColor: 'rgba(69,97,50,0.3)', color: '#9acd6a' }}
                        >
                          {CATEGORY_LABEL[item.category] ?? item.category}
                          {item.subcategory ? ` · ${item.subcategory}` : ''}
                        </span>
                        {!item.is_available && (
                          <span className="text-xs" style={{ color: 'rgba(239,68,68,0.75)' }}>
                            비노출
                          </span>
                        )}
                        {item.popular_order != null && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded shrink-0"
                            style={{ backgroundColor: 'rgba(201,162,39,0.18)', color: '#C9A227' }}
                          >
                            인기 #{item.popular_order}
                          </span>
                        )}
                      </div>

                      <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                        {item.name}
                      </p>

                      {item.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                          {item.description}
                        </p>
                      )}

                      {priceLabel && (
                        <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                          {priceLabel}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isEventPost ? (
                        <EventEditModalButton
                          item={item}
                          onUpdated={handleItemUpdated}
                          onDeleted={handleItemDeleted}
                        />
                      ) : (
                        <MenuEditModalButton
                          item={item}
                          onUpdated={handleItemUpdated}
                          onDeleted={handleItemDeleted}
                        />
                      )}
                      <DeleteMenuItemButton itemId={item.id} onDeleted={handleItemDeleted} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
