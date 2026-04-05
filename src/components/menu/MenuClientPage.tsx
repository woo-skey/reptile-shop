'use client'

import { useEffect, useMemo, useState } from 'react'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import { TAB_LABELS, type ViewMode } from '@/components/menu/MenuTypes'
import { useAuth } from '@/hooks/useAuth'
import type { MenuCategory, MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuCategory[]

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const viewFromUrl = params.get('view')

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuCategory)
    ? (tabFromUrl as MenuCategory)
    : 'event'

  const view = viewFromUrl === 'photo' ? 'photo' : 'list'
  return { tab, view: view as ViewMode }
}

export default function MenuClientPage({
  items,
  initialTab,
  initialView,
}: {
  items: MenuItem[]
  initialTab: MenuCategory
  initialView: ViewMode
}) {
  const { isAdmin } = useAuth()
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [activeTab, setActiveTab] = useState<MenuCategory>(() => {
    if (typeof window === 'undefined') return initialTab
    return parseStateFromUrl().tab
  })
  const [activeView, setActiveView] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return initialView
    return parseStateFromUrl().view
  })

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    params.delete('rows')
    if (activeView === 'list') params.delete('view')
    else params.set('view', activeView)
    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, activeView])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setActiveView(parsed.view)
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
        <MenuRowOptions activeMode={activeView} onChange={setActiveView} />
      </div>

      <div className="glass-card px-4 py-2">
        <MenuTable
          items={filteredItems}
          category={activeTab}
          viewMode={activeView}
          isAdmin={isAdmin}
          onItemUpdated={handleItemUpdated}
        />
      </div>
    </>
  )
}
