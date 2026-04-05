'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import EventWriteModalButton from '@/components/event/EventWriteModalButton'
import EventEditModalButton from '@/components/event/EventEditModalButton'
import type { MenuItem } from '@/types'

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

export default function EventClientPage({ items }: { items: MenuItem[] }) {
  const { isAdmin } = useAuth()
  const [eventItems, setEventItems] = useState<MenuItem[]>(items)

  useEffect(() => {
    setEventItems(items)
  }, [items])

  const sortedItems = useMemo(() => {
    return [...eventItems].sort((a, b) => {
      const sortDiff = a.sort_order - b.sort_order
      if (sortDiff !== 0) return sortDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [eventItems])

  const handleItemCreated = (created: MenuItem) => {
    setEventItems((prev) => [created, ...prev])
  }

  const handleItemUpdated = (updated: MenuItem) => {
    setEventItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
  }

  const handleItemDeleted = (deletedId: string) => {
    setEventItems((prev) => prev.filter((item) => item.id !== deletedId))
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          이벤트
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        {isAdmin && <EventWriteModalButton onCreated={handleItemCreated} />}
      </div>

      {sortedItems.length === 0 ? (
        <div className="glass-card px-6 py-12 text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 이벤트가 없습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.map((item) => (
            <article
              key={item.id}
              className="glass-card p-4 sm:p-5"
              style={{ border: '1px solid rgba(201,162,39,0.2)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3
                    className="text-base sm:text-lg font-semibold break-words"
                    style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#C9A227', opacity: 0.8 }}>
                    {formatDate(item.created_at)}
                  </p>
                </div>

                {isAdmin && (
                  <EventEditModalButton
                    item={item}
                    onUpdated={handleItemUpdated}
                    onDeleted={handleItemDeleted}
                  />
                )}
              </div>

              {item.description && (
                <p
                  className="text-sm mt-3 whitespace-pre-line break-words"
                  style={{ color: 'var(--foreground)', opacity: 0.78, lineHeight: 1.6 }}
                >
                  {item.description}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  )
}
