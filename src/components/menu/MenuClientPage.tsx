'use client'

import { useEffect, useMemo, useState } from 'react'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import MenuEditModalButton from '@/components/menu/MenuEditModalButton'
import { TAB_LABELS, type RowOptionKey } from '@/components/menu/MenuTypes'
import type { MenuCategory, MenuItem } from '@/types'

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuCategory[]

const getRowLimit = (rows: RowOptionKey) => (rows === 'all' ? null : parseInt(rows, 10))

const parseStateFromUrl = () => {
  const params = new URLSearchParams(window.location.search)
  const tabFromUrl = params.get('tab')
  const rowsFromUrl = params.get('rows')

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuCategory)
    ? (tabFromUrl as MenuCategory)
    : 'event'

  const rows = rowsFromUrl === '2' || rowsFromUrl === '3' || rowsFromUrl === '5'
    ? rowsFromUrl
    : 'all'

  return { tab, rows: rows as RowOptionKey }
}

export default function MenuClientPage({
  items,
  initialTab,
  initialRows,
  isAdmin,
}: {
  items: MenuItem[]
  initialTab: MenuCategory
  initialRows: RowOptionKey
  isAdmin: boolean
}) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)
  const [activeTab, setActiveTab] = useState<MenuCategory>(initialTab)
  const [activeRows, setActiveRows] = useState<RowOptionKey>(initialRows)

  useEffect(() => {
    setMenuItems(items)
  }, [items])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set('tab', activeTab)
    if (activeRows === 'all') params.delete('rows')
    else params.set('rows', activeRows)
    const next = params.toString() ? `/menu?${params.toString()}` : '/menu'
    window.history.replaceState(null, '', next)
  }, [activeTab, activeRows])

  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseStateFromUrl()
      setActiveTab(parsed.tab)
      setActiveRows(parsed.rows)
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
        <MenuRowOptions activeRows={activeRows} onChange={setActiveRows} />
      </div>

      <div className="glass-card px-4 py-2">
        <MenuTable items={filteredItems} category={activeTab} rowLimit={getRowLimit(activeRows)} />
      </div>

      {isAdmin && (
        <div className="glass-card mt-4 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              관리자 메뉴 수정
            </h3>
            <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              {filteredItems.length}개
            </span>
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              수정할 메뉴가 없습니다.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {filteredItems.map((item) => (
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
                      {item.subcategory ? `${item.subcategory} · ` : ''}
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
