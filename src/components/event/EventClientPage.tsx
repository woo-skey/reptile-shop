'use client'

import { useEffect, useMemo, useState } from 'react'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
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
        <MenuTable
          items={sortedItems}
          category="event"
          viewMode={activeView}
          isAdmin={isAdmin}
          onItemUpdated={handleItemUpdated}
        />
      </div>
    </>
  )
}
