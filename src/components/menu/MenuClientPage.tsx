'use client'

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuCalculatorModal from '@/components/menu/MenuCalculatorModal'
import EventDetailModal, { type EventDetailModalItem } from '@/components/event/EventDetailModal'
import { TAB_LABELS, type MenuTabCategory, type ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuTabCategory[]

const WHISKY_SUBS = [
  { key: 'single_malt', label: 'Single Malt' },
  { key: 'blended', label: 'Blended' },
  { key: 'bourbon', label: 'Bourbon' },
  { key: 'tennessee', label: 'Tennessee' },
] as const

const WHISKY_SUB_KEYS = WHISKY_SUBS.map((s) => s.key) as readonly string[]

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const viewFromUrl = params.get('view')
  const query = params.get('q')?.trim() ?? ''
  const subFromUrl = params.get('sub') ?? ''

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuTabCategory)
    ? (tabFromUrl as MenuTabCategory)
    : 'event'
  const view: ViewMode = viewFromUrl === 'photo' ? 'photo' : 'list'
  const sub = tab === 'whisky' && WHISKY_SUB_KEYS.includes(subFromUrl)
    ? subFromUrl
    : (tab === 'whisky' ? 'single_malt' : '')

  return { tab, view, query, sub }
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
  initialSub,
}: {
  items: MenuItem[]
  initialTab: MenuTabCategory
  initialView: ViewMode
  initialQuery: string
  initialSub: string
}) {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => new Set())
  const [activeTab, setActiveTab] = useState<MenuTabCategory>(initialTab)
  const [viewMode, setViewMode] = useState<ViewMode>(initialView)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [activeSub, setActiveSub] = useState<string>(initialSub)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [orderSaving, setOrderSaving] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [detailItem, setDetailItem] = useState<EventDetailModalItem | null>(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [calcPrefill, setCalcPrefill] = useState<Array<{ name: string; suffix: string; unitPrice: number; quantity: number }> | undefined>(undefined)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingOrderRef = useRef<{ category: MenuTabCategory; items: MenuItem[] } | null>(null)
  const savingRef = useRef(false)
  const [, startTabTransition] = useTransition()

  const isEventTab = activeTab === 'event'
  const isFoodTab = activeTab === 'food'
  const isWhiskyTab = activeTab === 'whisky'
  const effectiveViewMode: ViewMode = isEventTab ? 'photo' : (isFoodTab ? viewMode : 'list')
  const deferredSearchQuery = useDeferredValue(searchQuery)

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  useEffect(() => {
    setActiveTab(initialTab)
    setViewMode(initialView)
    setSearchQuery(initialQuery)
    setActiveSub(initialSub)
  }, [initialQuery, initialTab, initialView, initialSub])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set())
      return
    }
    let cancelled = false
    const supabase = createClient()
    void supabase
      .from('menu_favorites')
      .select('menu_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (cancelled) return
        const ids = (data ?? []).map((r) => (r as { menu_id: string }).menu_id)
        setFavoriteIds(new Set(ids))
      })
    return () => {
      cancelled = true
    }
  }, [user])

  const toggleFavorite = async (menuId: string) => {
    if (!user) return
    const isFav = favoriteIds.has(menuId)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (isFav) next.delete(menuId)
      else next.add(menuId)
      return next
    })

    const supabase = createClient()
    if (isFav) {
      const { error } = await supabase
        .from('menu_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('menu_id', menuId)
      if (error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.add(menuId)
          return next
        })
      }
    } else {
      const { error } = await supabase
        .from('menu_favorites')
        .insert({ user_id: user.id, menu_id: menuId })
      if (error) {
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(menuId)
          return next
        })
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const calcParam = params.get('calc')
    if (!calcParam) return
    try {
      const parsed = JSON.parse(decodeURIComponent(calcParam)) as unknown
      if (
        Array.isArray(parsed) &&
        parsed.every(
          (l): l is { name: string; suffix: string; unitPrice: number; quantity: number } =>
            !!l && typeof l === 'object' &&
            typeof (l as Record<string, unknown>).name === 'string' &&
            typeof (l as Record<string, unknown>).unitPrice === 'number' &&
            typeof (l as Record<string, unknown>).quantity === 'number'
        )
      ) {
        setCalcPrefill(parsed)
        setCalcOpen(true)
      }
    } catch {
      // ignore malformed
    } finally {
      params.delete('calc')
      const qs = params.toString()
      window.history.replaceState(null, '', qs ? `/menu?${qs}` : '/menu')
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
    if (isWhiskyTab && activeSub) {
      params.set('sub', activeSub)
    } else {
      params.delete('sub')
    }

    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, isFoodTab, isWhiskyTab, searchQuery, viewMode, activeSub])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setViewMode(parsed.view)
      setSearchQuery(parsed.query)
      setActiveSub(parsed.sub)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const itemsByTab = useMemo(() => {
    const grouped = TAB_KEYS.reduce<Record<MenuTabCategory, MenuItem[]>>((acc, key) => {
      acc[key] = []
      return acc
    }, {} as Record<MenuTabCategory, MenuItem[]>)

    for (const item of menuItems) {
      if (!(item.category in grouped)) continue
      grouped[item.category as MenuTabCategory].push(item)
    }

    for (const key of TAB_KEYS) {
      grouped[key] = grouped[key].slice().sort(sortByOrder)
    }

    return grouped
  }, [menuItems])

  const tabItems = useMemo(
    () => itemsByTab[activeTab] ?? [],
    [activeTab, itemsByTab]
  )

  const normalizedSearch = deferredSearchQuery.trim().toLowerCase()

  const subFilteredTabItems = useMemo(() => {
    if (!isWhiskyTab || !activeSub) return tabItems
    return tabItems.filter((item) => item.subcategory === activeSub)
  }, [isWhiskyTab, activeSub, tabItems])

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return subFilteredTabItems

    return subFilteredTabItems.filter((item) => {
      const source = [item.name, item.description, item.note]
      return source.some((field) => {
        if (typeof field !== 'string') return false
        return field.toLowerCase().includes(normalizedSearch)
      })
    })
  }, [normalizedSearch, subFilteredTabItems])

  const canDragRows =
    isAdmin &&
    filteredItems.length > 1 &&
    effectiveViewMode === 'list' &&
    normalizedSearch.length === 0

  const handleItemUpdated = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemCreated = (created: MenuItem) => {
    setMenuItems((prev) => [created, ...prev.filter((item) => item.id !== created.id)])
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

  const handleTabChange = (nextTab: MenuTabCategory) => {
    if (nextTab === activeTab) return
    startTabTransition(() => {
      setActiveTab(nextTab)
      if (nextTab === 'whisky') {
        setActiveSub((prev) => (WHISKY_SUB_KEYS.includes(prev) ? prev : 'single_malt'))
      } else {
        setActiveSub('')
      }
    })
  }

  return (
    <>
      <MenuTabs activeTab={activeTab} onChange={handleTabChange} />

      {isWhiskyTab && (
        <div className="flex flex-wrap items-center gap-2 mb-3" role="tablist" aria-label="위스키 종류">
          {WHISKY_SUBS.map(({ key, label }) => {
            const active = activeSub === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveSub(key)}
                className="text-xs font-bold px-3 py-1.5 rounded-md border transition-all"
                style={
                  active
                    ? { backgroundColor: '#456132', color: '#F5F0E8', borderColor: '#C9A227' }
                    : { color: 'var(--foreground)', borderColor: 'rgba(201, 162, 39, 0.35)', opacity: 0.75 }
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

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
        <button
          type="button"
          onClick={() => setCalcOpen(true)}
          className="text-xs px-3 py-1.5 rounded-lg border"
          style={{ color: '#C9A227', borderColor: 'rgba(201, 162, 39, 0.45)' }}
        >
          계산기
        </button>
        {isAdmin && <MenuAddModalButton category={activeTab} onCreated={handleItemCreated} />}
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
          favoriteIds={user ? favoriteIds : null}
          onToggleFavorite={user ? toggleFavorite : undefined}
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
      <MenuCalculatorModal
        items={menuItems}
        isOpen={calcOpen}
        onClose={() => {
          setCalcOpen(false)
          setCalcPrefill(undefined)
        }}
        prefillLines={calcPrefill}
      />
    </>
  )
}
