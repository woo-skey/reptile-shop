'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDialogs } from '@/components/providers/DialogProvider'

type OrderItem = {
  name: string
  suffix: string
  unitPrice: number
  quantity: number
}

export type OrderHistoryRow = {
  id: string
  items: OrderItem[]
  total: number
  created_at: string
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const buildPrefillQuery = (items: OrderItem[]) => {
  const encoded = encodeURIComponent(JSON.stringify(items))
  return `/menu?calc=${encoded}`
}

export default function OrderHistoryList({ initialOrders }: { initialOrders: OrderHistoryRow[] }) {
  const dialogs = useDialogs()
  const [orders, setOrders] = useState<OrderHistoryRow[]>(initialOrders)

  const handleDelete = async (id: string) => {
    const ok = await dialogs.confirm({
      message: '이 주문 기록을 삭제할까요?',
      variant: 'danger',
    })
    if (!ok) return

    const supabase = createClient()
    const { error } = await supabase.from('order_history').delete().eq('id', id)
    if (error) {
      await dialogs.alert({ message: '삭제에 실패했습니다.' })
      return
    }
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  if (orders.length === 0) {
    return (
      <div className="glass-card py-10 text-center">
        <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
          저장된 주문 기록이 없습니다.
        </p>
        <Link
          href="/menu"
          className="inline-block mt-3 text-sm underline"
          style={{ color: '#C9A227' }}
        >
          메뉴 계산기 열기
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <div key={o.id} className="glass-card px-5 py-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              {formatDate(o.created_at)}
            </span>
            <span className="text-sm font-bold" style={{ color: '#C9A227' }}>
              {o.total.toLocaleString()}원
            </span>
          </div>
          <ul className="space-y-1 mb-3">
            {o.items.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-xs"
                style={{ color: 'var(--foreground)', opacity: 0.8 }}
              >
                <span className="break-keep">
                  {item.name}
                  {item.suffix && <span className="ml-1 opacity-60">· {item.suffix}</span>}
                  <span className="ml-1.5 opacity-60">× {item.quantity}</span>
                </span>
                <span className="opacity-70">
                  {(item.unitPrice * item.quantity).toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-2">
            <Link
              href={buildPrefillQuery(o.items)}
              className="text-xs px-3 py-1.5 rounded-md border"
              style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
            >
              다시 주문
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(o.id)}
              className="text-xs px-3 py-1.5"
              style={{ color: 'rgba(239,68,68,0.7)' }}
            >
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
