'use client'

import { useEffect, useMemo, useState } from 'react'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import MenuEditModalButton from '@/components/menu/MenuEditModalButton'
import type { ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import type { MenuItem } from '@/types'

const parseViewFromUrl = (): ViewMode => {
  const params = new URLSearchParams(window.location.search)
  return params.get('view') === 'photo' ? 'photo' : 'list'
}

export default function EventClientPage({ items }: { items: MenuItem[] }) {
  const { isAdmin } = useAuth()
  const [eventItems, setEventItems] = useState<MenuItem[]>(items)
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    return parseViewFromUrl()
  })

  useEffect(() => {
    setEventItems(items)
  }, [items])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (activeView === 'list') params.delete('view')
    else params.set('view', activeView)
    const next = params.toString() ? `/event?${params.toString()}` : '/event'
    window.history.replaceState(null, '', next)
  }, [activeView])

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(parseViewFromUrl())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const sortedItems = useMemo(
    () => [...eventItems].sort((a, b) => a.sort_order - b.sort_order),
    [eventItems]
  )

  const handleItemUpdated = (updated: MenuItem) => {
    setEventItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          Event / New
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        {isAdmin && <MenuAddModalButton category="event" />}
      </div>

      <div className="mb-6">
        <MenuRowOptions activeMode={activeView} onChange={setActiveView} />
      </div>

      <div className="glass-card px-4 py-2">
        <MenuTable items={sortedItems} category="event" viewMode={activeView} />
      </div>

      {isAdmin && (
        <div className="glass-card mt-4 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              관리자 이벤트 수정
            </h3>
            <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              {sortedItems.length}개
            </span>
          </div>

          {sortedItems.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              수정할 이벤트가 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-2 py-2 rounded-md"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                      {item.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                      {item.price != null ? `${item.price.toLocaleString('ko-KR')}원` : '가격 미정'}
                    </p>
                  </div>
                  <MenuEditModalButton item={item} onUpdated={handleItemUpdated} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
