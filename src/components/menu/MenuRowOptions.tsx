'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const ROW_OPTIONS = [
  { key: 'all', label: '전체 보기' },
  { key: '2', label: '2행 보기' },
  { key: '3', label: '3행 보기' },
  { key: '5', label: '5행 보기' },
] as const

export default function MenuRowOptions({ activeRows }: { activeRows: 'all' | '2' | '3' | '5' }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleOption = (key: 'all' | '2' | '3' | '5') => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('rows')
    else params.set('rows', key)
    router.push(`/menu?${params.toString()}`)
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {ROW_OPTIONS.map(({ key, label }) => {
        const active = activeRows === key
        return (
          <button
            key={key}
            onClick={() => handleOption(key)}
            className="px-2.5 py-1 text-xs rounded-md border transition-all"
            style={{
              backgroundColor: active ? 'rgba(69,97,50,0.7)' : 'transparent',
              color: active ? '#F5F0E8' : 'rgba(245, 240, 232, 0.6)',
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
