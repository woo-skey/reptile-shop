'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import { TAB_LABELS, type MenuTabCategory, type ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import type { MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuTabCategory[]

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const viewFromUrl = params.get('view')

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuTabCategory)
    ? (tabFromUrl as MenuTabCategory)
    : 'event'
  const view: ViewMode = viewFromUrl === 'photo' ? 'photo' : 'list'

  return { tab, view }
}

const sortByOrder = (a: MenuItem, b: MenuItem) => {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return a.created_at.localeCompare(b.created_at)
}

export default function MenuClientPage({
  items,
  initialTab,
}: {
  items: MenuItem[]
  initialTab: MenuTabCategory
}) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [activeTab, setActiveTab] = useState<MenuTabCategory>(() => {
    if (typeof window === 'undefined') return initialTab
    return parseStateFromUrl().tab
  })
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'list'
    return parseStateFromUrl().view
  })
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderSaving, setOrderSaving] = useState(false)
  const [orderError, setOrderError] = useState('')

  const canUsePhotoView = activeTab === 'event' || activeTab === 'food'

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  useEffect(() => {
    if (!canUsePhotoView && viewMode !== 'list') {
      setViewMode('list')
    }
  }, [canUsePhotoView, viewMode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    params.delete('rows')
    params.delete('event_view')
    if (canUsePhotoView && viewMode === 'photo') {
      params.set('view', 'photo')
    } else {
      params.delete('view')
    }

    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, canUsePhotoView, viewMode])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setViewMode(parsed.view)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const filteredItems = useMemo(() =>
    menuItems
      .filter((item) => item.category === activeTab)
      .slice()
      .sort(sortByOrder),
    [menuItems, activeTab]
  )

  const handleItemUpdated = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemDeleted = (deletedId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== deletedId))
  }

  const persistOrder = async (ordered: MenuItem[]) => {
    if (!isAdmin) return

    setOrderSaving(true)
    setOrderError('')

    try {
      const payload = {
        category: activeTab,
        items: ordered.map((item, index) => ({ id: item.id, sort_order: index })),
      }

      const response = await fetch('/api/admin/menu-items/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '순서 저장에 실패했습니다.' }))
        throw new Error(data.error ?? '순서 저장에 실패했습니다.')
      }
    } catch (error) {
      setOrderError(error instanceof Error ? error.message : '순서 저장에 실패했습니다.')
      router.refresh()
    } finally {
      setOrderSaving(false)
    }
  }

  const handleDrop = async (targetId: string) => {
    if (!isAdmin || !draggingId || draggingId === targetId || orderSaving) {
      setDraggingId(null)
      return
    }

    const fromIndex = filteredItems.findIndex((item) => item.id === draggingId)
    const toIndex = filteredItems.findIndex((item) => item.id === targetId)
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      setDraggingId(null)
      return
    }

    const nextOrdered = filteredItems.slice()
    const [moved] = nextOrdered.splice(fromIndex, 1)
    nextOrdered.splice(toIndex, 0, moved)
    const normalized = nextOrdered.map((item, index) => ({ ...item, sort_order: index }))
    const normalizeMap = new Map(normalized.map((item) => [item.id, item]))

    setMenuItems((prev) =>
      prev.map((item) => (item.category === activeTab ? (normalizeMap.get(item.id) ?? item) : item))
    )

    setDraggingId(null)
    await persistOrder(normalized)
  }

  return (
    <>
      <MenuTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          {TAB_LABELS[activeTab]}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        {canUsePhotoView && <MenuRowOptions activeMode={viewMode} onChange={setViewMode} />}
        {isAdmin && <MenuAddModalButton category={activeTab} />}
      </div>

      {isAdmin && filteredItems.length > 1 && (
        <div className="glass-card px-3 py-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              드래그로 메뉴 순서 변경
            </p>
            {orderSaving && (
              <span className="text-[11px]" style={{ color: '#C9A227', opacity: 0.85 }}>
                저장 중...
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            {filteredItems.map((item, index) => (
              <div
                key={item.id}
                draggable={!orderSaving}
                onDragStart={() => setDraggingId(item.id)}
                onDragEnd={() => setDraggingId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => void handleDrop(item.id)}
                className="flex items-center gap-2 px-2 py-2 rounded-md border text-xs transition-colors"
                style={{
                  borderColor: draggingId === item.id ? 'rgba(201,162,39,0.65)' : 'rgba(201,162,39,0.25)',
                  backgroundColor: draggingId === item.id ? 'rgba(69,97,50,0.22)' : 'rgba(255,255,255,0.02)',
                  color: 'var(--foreground)',
                  cursor: orderSaving ? 'not-allowed' : 'grab',
                }}
              >
                <span className="w-5 shrink-0 text-center" style={{ color: '#C9A227', opacity: 0.85 }}>
                  {index + 1}
                </span>
                <span className="truncate flex-1" style={{ opacity: 0.9 }}>
                  {item.name}
                </span>
                <span className="shrink-0 select-none" style={{ opacity: 0.4 }}>
                  ⋮⋮
                </span>
              </div>
            ))}
          </div>

          {orderError && (
            <p className="text-xs mt-2 text-red-400">
              {orderError}
            </p>
          )}
        </div>
      )}

      <div className="glass-card px-4 py-2">
        <MenuTable
          items={filteredItems}
          category={activeTab}
          viewMode={canUsePhotoView ? viewMode : 'list'}
          isAdmin={isAdmin}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
        />
      </div>
    </>
  )
}
