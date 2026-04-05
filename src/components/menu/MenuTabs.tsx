'use client'

import type { MenuCategory } from '@/types'

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

export default function MenuTabs({
  activeTab,
  onChange,
}: {
  activeTab: MenuCategory
  onChange: (tab: MenuCategory) => void
}) {
  const handleTab = (key: MenuCategory) => {
    if (key === activeTab) return
    onChange(key)
  }

  return (
    <div className="mb-8 -mx-1 px-1 overflow-x-auto">
      <div className="flex gap-1 w-max min-w-full sm:min-w-0 sm:flex-wrap">
        {TABS.map(({ key, label }) => {
          const tabKey = key as MenuCategory
          const active = activeTab === tabKey
          return (
            <button
              key={key}
              onClick={() => handleTab(tabKey)}
              className="shrink-0 px-3 py-1.5 text-xs rounded-md border transition-all"
              style={{
                backgroundColor: active ? '#456132' : 'transparent',
                color: active ? '#F5F0E8' : 'rgba(245, 240, 232, 0.55)',
                borderColor: active ? '#C9A227' : 'rgba(201, 162, 39, 0.2)',
                fontWeight: active ? 600 : 400,
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
