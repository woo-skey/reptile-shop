'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import EventDetailModal, { type EventDetailModalItem } from '@/components/event/EventDetailModal'
import { TAB_LABELS, type MenuTabCategory, type ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import type { MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuTabCategory[]

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const viewFromUrl = params.get('view')
  const query = params.get('q')?.trim() ?? ''

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuTabCategory)
    ? (tabFromUrl as MenuTabCategory)
    : 'event'
  const view: ViewMode = viewFromUrl === 'photo' ? 'photo' : 'list'

  return { tab, view, query }
}

const sortByOrder = (a: MenuItem, b: MenuItem) => {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order
  return a.created_at.localeCompare(b.created_at)
}

export default function MenuClientPage({
  items,
  initialTab,
  initialView,
  initialQuery,
}: {
  items: MenuItem[]
  initialTab: MenuTabCategory
  initialView: ViewMode
  initialQuery: string
}) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [activeTab, setActiveTab] = useState<MenuTabCategory>(initialTab)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderSaving, setOrderSaving] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [detailItem, setDetailItem] = useState<EventDetailModalItem | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingOrderRef = useRef<{ category: MenuTabCategory; items: MenuItem[] } | null>(null)
  const savingRef = useRef(false)

  const isEventTab = activeTab === 'event'
  const isFoodTab = activeTab === 'food'
  const effectiveViewMode: ViewMode = isEventTab ? 'photo' : (isFoodTab ? viewMode : 'list')

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  useEffect(() => {
    setActiveTab(initialTab)
    setViewMode(initialView)
    setSearchQuery(initialQuery)
  }, [initialQuery, initialTab, initialView])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isFoodTab && viewMode !== 'list') {
      setViewMode('list')
    }
  }, [isFoodTab, viewMode])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    params.delete('rows')
    params.delete('event_view')
    if (isFoodTab && viewMode === 'photo') {
      params.set('view', 'photo')
    } else {
      params.delete('view')
    }
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.delete('q')
    }

    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, isFoodTab, searchQuery, viewMode])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setViewMode(parsed.view)
      setSearchQuery(parsed.query)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const tabItems = useMemo(() =>
    menuItems
      .filter((item) => item.category === activeTab)
      .slice()
      .sort(sortByOrder),
    [menuItems, activeTab]
  )

  const normalizedSearch = searchQuery.trim().toLowerCase()

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return tabItems

    return tabItems.filter((item) => {
      const source = [item.name, item.description, item.note]
      return source.some((field) => {
        if (typeof field !== 'string') return false
        return field.toLowerCase().includes(normalizedSearch)
      })
    })
  }, [normalizedSearch, tabItems])

  const canDragRows =
    isAdmin &&
    filteredItems.length > 1 &&
    effectiveViewMode === 'list' &&
    normalizedSearch.length === 0

  const handleItemUpdated = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemDeleted = (deletedId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== deletedId))
    setDetailItem((prev) => (prev?.id === deletedId ? null : prev))
  }

  const handleItemPreview = (item: MenuItem) => {
    if (item.category !== 'event') return

    setDetailItem({
      id: item.id,
      title: item.name,
      content: item.description,
      imageUrl: item.image_url ?? item.note,
      createdAt: item.created_at,
    })
  }

  const flushOrder = async () => {
    if (!isAdmin || savingRef.current || !pendingOrderRef.current) return

    const pending = pendingOrderRef.current
    pendingOrderRef.current = null
    savingRef.current = true
    setOrderSaving(true)
    setOrderError('')

    try {
      const payload = {
        category: pending.category,
        items: pending.items.map((item, index) => ({ id: item.id, sort_order: index })),
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
      savingRef.current = false
      setOrderSaving(false)
      if (pendingOrderRef.current) {
        void flushOrder()
      }
    }
  }

  const schedulePersistOrder = (category: MenuTabCategory, ordered: MenuItem[]) => {
    pendingOrderRef.current = { category, items: ordered }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void flushOrder()
    }, 120)
  }

  const applyReorder = (nextOrdered: MenuItem[]) => {
    const normalized = nextOrdered.map((item, index) => ({ ...item, sort_order: index }))
    const normalizeMap = new Map(normalized.map((item) => [item.id, item]))

    setMenuItems((prev) =>
      prev.map((item) => (item.category === activeTab ? (normalizeMap.get(item.id) ?? item) : item))
    )

    schedulePersistOrder(activeTab, normalized)
  }

  const handleDrop = (targetId: string) => {
    if (!isAdmin || !draggingId || draggingId === targetId) {
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
    applyReorder(nextOrdered)
    setDraggingId(null)
  }

  const moveByStep = (id: string, direction: -1 | 1) => {
    if (!canDragRows) return
    const index = filteredItems.findIndex((item) => item.id === id)
    if (index < 0) return
    const target = index + direction
    if (target < 0 || target >= filteredItems.length) return

    const nextOrdered = filteredItems.slice()
    const [moved] = nextOrdered.splice(index, 1)
    nextOrdered.splice(target, 0, moved)
    applyReorder(nextOrdered)
  }

  return (
    <>
      <MenuTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex flex-wrap items-center gap-3 mb-3">
        {isFoodTab && <MenuRowOptions activeMode={viewMode} onChange={setViewMode} />}
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          {TAB_LABELS[activeTab]}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        {orderSaving && (
          <span className="text-xs" style={{ color: '#C9A227', opacity: 0.85 }}>
            순서 저장 중...
          </span>
        )}
        {isAdmin && <MenuAddModalButton category={activeTab} />}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="메뉴 검색 (이름/설명)"
          className="glass-input w-full px-3 py-2 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
        {searchQuery.trim().length > 0 && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-3 py-2 text-xs rounded-md border shrink-0"
            style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.35)' }}
          >
            초기화
          </button>
        )}
      </div>

      {canDragRows && (
        <p className="text-xs mb-2" style={{ color: 'var(--foreground)', opacity: 0.58 }}>
          리스트에서 항목을 드래그해 순서를 바꿀 수 있습니다.
        </p>
      )}
      {normalizedSearch.length > 0 && filteredItems.length === 0 && (
        <p className="text-xs mb-2" style={{ color: 'var(--foreground)', opacity: 0.58 }}>
          검색 결과가 없습니다.
        </p>
      )}
      {orderError && (
        <p className="text-xs mb-2 text-red-400">
          {orderError}
        </p>
      )}

      <div className="glass-card px-4 py-2">
        <MenuTable
          items={filteredItems}
          category={activeTab}
          viewMode={effectiveViewMode}
          isAdmin={isAdmin}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
          onItemPreview={handleItemPreview}
          dragContext={
            canDragRows
              ? {
                  enabled: true,
                  draggingId,
                  onDragStart: setDraggingId,
                  onDragEnd: () => setDraggingId(null),
                  onDrop: (id) => {
                    handleDrop(id)
                  },
                  onMoveUp: (id) => moveByStep(id, -1),
                  onMoveDown: (id) => moveByStep(id, 1),
                  canMoveUp: (id) => filteredItems.findIndex((item) => item.id === id) > 0,
                  canMoveDown: (id) => {
                    const index = filteredItems.findIndex((item) => item.id === id)
                    return index >= 0 && index < filteredItems.length - 1
                  },
                }
              : undefined
          }
        />
      </div>

      <EventDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  )
}
