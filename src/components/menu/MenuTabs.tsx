'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
] as const

export default function MenuTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [optimisticTab, setOptimisticTab] = useState(activeTab)

  useEffect(() => {
    setOptimisticTab(activeTab)
  }, [activeTab])

  const handleTab = (key: string) => {
    if (key === optimisticTab) return
    setOptimisticTab(key)

    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    const nextHref = `/menu?${params.toString()}`

    startTransition(() => {
      router.replace(nextHref, { scroll: false })
    })
  }

  return (
    <div className="flex gap-1 flex-wrap mb-8">
      {TABS.map(({ key, label }) => {
        const active = optimisticTab === key
        return (
          <button
            key={key}
            onClick={() => handleTab(key)}
            disabled={isPending}
            className="px-3 py-1.5 text-xs rounded-md border transition-all disabled:opacity-70"
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
