'use client'

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

export default function MenuTabs({
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
      <div className="flex flex-wrap gap-1">
        {TABS.map(({ key, label }) => {
          const tabKey = key as MenuTabCategory
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
