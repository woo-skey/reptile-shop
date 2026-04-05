'use client'

import { useEffect, useMemo, useState } from 'react'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import { TAB_LABELS, type MenuTabCategory, type ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import type { MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuTabCategory[]

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const viewFromUrl = params.get('view')
  const eventViewFromUrl = params.get('event_view')

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuTabCategory)
    ? (tabFromUrl as MenuTabCategory)
    : 'event'

  const menuView = viewFromUrl === 'photo' ? 'photo' : 'list'
  const eventView = eventViewFromUrl === 'list' ? 'list' : 'photo'

  return { tab, menuView: menuView as ViewMode, eventView: eventView as ViewMode }
}

export default function MenuClientPage({
  items,
  initialTab,
  initialView,
}: {
  items: MenuItem[]
  initialTab: MenuTabCategory
  initialView: ViewMode
}) {
  const { isAdmin } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [activeTab, setActiveTab] = useState<MenuTabCategory>(() => {
    if (typeof window === 'undefined') return initialTab
    return parseStateFromUrl().tab
  })
  const [menuView, setMenuView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initialView
    return parseStateFromUrl().menuView
  })
  const [eventView, setEventView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'photo'
    return parseStateFromUrl().eventView
  })

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  const activeView = activeTab === 'event' ? eventView : menuView

  const handleViewChange = (nextView: ViewMode) => {
    if (activeTab === 'event') {
      setEventView(nextView)
      return
    }

    setMenuView(nextView)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    params.delete('rows')

    if (menuView === 'list') params.delete('view')
    else params.set('view', menuView)

    if (eventView === 'photo') params.delete('event_view')
    else params.set('event_view', eventView)

    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, menuView, eventView])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setMenuView(parsed.menuView)
      setEventView(parsed.eventView)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const filteredItems = useMemo(
    () => menuItems.filter((item) => item.category === activeTab),
    [menuItems, activeTab]
  )

  const handleItemUpdated = (updated: MenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemDeleted = (deletedId: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== deletedId))
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
        {isAdmin && <MenuAddModalButton category={activeTab} />}
      </div>

      <div className="mb-6">
        <MenuRowOptions activeMode={activeView} onChange={handleViewChange} />
      </div>

      <div className="glass-card px-4 py-2">
        <MenuTable
          items={filteredItems}
          category={activeTab}
          viewMode={activeView}
          isAdmin={isAdmin}
          onItemUpdated={handleItemUpdated}
          onItemDeleted={handleItemDeleted}
        />
      </div>
    </>
  )
}
