'use client'

import { memo } from 'react'
import type { MenuTabCategory } from '@/components/menu/MenuTypes'

const TABS = [
  { key: 'event', label: 'Event / New' },
  { key: 'food', label: 'Food' },
  { key: 'signature', label: 'Signature' },
  { key: 'cocktail', label: 'Cocktail' },
  { key: 'beer', label: 'Beer' },
  { key: 'wine', label: 'Wine' },
  { key: 'whisky', label: 'Whisky' },
  { key: 'shochu', label: 'Shochu' },
  { key: 'spirits', label: 'Spirits' },
  { key: 'non_alcohol', label: 'Non-Alcohol' },
  { key: 'beverage', label: 'Beverage' },
] as const

function MenuTabs({
  activeTab,
  onChange,
}: {
  activeTab: MenuTabCategory
  onChange: (tab: MenuTabCategory) => void
}) {
  const handleTab = (key: MenuTabCategory) => {
    if (key === activeTab) return
    onChange(key)
  }

  return (
    <div className="mb-8">
      <div
        className="flex gap-1 overflow-x-auto pb-1 pr-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {TABS.map(({ key, label }) => {
          const tabKey = key as MenuTabCategory
          const active = activeTab === tabKey
          return (
            <button
              type="button"
              key={key}
              onClick={() => handleTab(tabKey)}
              aria-pressed={active}
              className="shrink-0 whitespace-nowrap px-3 py-1.5 text-xs rounded-md border transition-all"
              style={{
                backgroundColor: active ? '#456132' : 'transparent',
                color: active ? '#F5F0E8' : 'rgba(245, 240, 232, 0.55)',
                borderColor: active ? '#C9A227' : 'rgba(201, 162, 39, 0.2)',
                fontWeight: 700,
              }}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default memo(MenuTabs)
