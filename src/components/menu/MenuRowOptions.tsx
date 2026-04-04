'use client'

import { useEffect, useState, useTransition } from 'react'
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
  const [isPending, startTransition] = useTransition()
  const [optimisticRows, setOptimisticRows] = useState(activeRows)

  useEffect(() => {
    setOptimisticRows(activeRows)
  }, [activeRows])

  const handleOption = (key: 'all' | '2' | '3' | '5') => {
    if (key === optimisticRows) return
    setOptimisticRows(key)

    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('rows')
    else params.set('rows', key)
    const nextHref = params.toString() ? `/menu?${params.toString()}` : '/menu'

    startTransition(() => {
      router.replace(nextHref, { scroll: false })
    })
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {ROW_OPTIONS.map(({ key, label }) => {
        const active = optimisticRows === key
        return (
          <button
            key={key}
            onClick={() => handleOption(key)}
            disabled={isPending}
            className="px-2.5 py-1 text-xs rounded-md border transition-all disabled:opacity-70"
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
