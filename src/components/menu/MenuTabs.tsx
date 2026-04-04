'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const TABS = [
  { key: 'event',     label: 'Event / New' },
  { key: 'food',      label: 'Food' },
  { key: 'signature', label: 'Signature' },
  { key: 'cocktail',  label: 'Cocktail' },
  { key: 'beer',      label: 'Beer' },
  { key: 'wine',      label: 'Wine' },
  { key: 'whisky',    label: 'Whisky' },
  { key: 'shochu',    label: 'Shochu' },
  { key: 'spirits',   label: 'Spirits' },
] as const

export default function MenuTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleTab = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    router.push(`/menu?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 flex-wrap mb-8">
      {TABS.map(({ key, label }) => {
        const active = activeTab === key
        return (
          <button
            key={key}
            onClick={() => handleTab(key)}
            className="px-3 py-1.5 text-xs rounded-md border transition-all"
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
  )
}
