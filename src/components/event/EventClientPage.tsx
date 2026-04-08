'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import EventWriteModalButton from '@/components/event/EventWriteModalButton'
import EventEditModalButton from '@/components/event/EventEditModalButton'
import EventDetailModal, { type EventDetailModalItem } from '@/components/event/EventDetailModal'
import EventGridCard from '@/components/event/EventGridCard'
import type { MenuItem } from '@/types'

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })

const resolveImageUrl = (item: MenuItem) => {
  const imageUrl = item.image_url ?? item.note
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
    return imageUrl
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return null
  return `${baseUrl}/storage/v1/object/public/post-images/${imageUrl}`
}

export default function EventClientPage({ items }: { items: MenuItem[] }) {
  const { isAdmin } = useAuth()
  const [eventItems, setEventItems] = useState<MenuItem[]>(items)
  const [detailItem, setDetailItem] = useState<EventDetailModalItem | null>(null)

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
    setDetailItem((prev) => (prev?.id === deletedId ? null : prev))
  }

  const openDetail = (item: MenuItem) => {
    setDetailItem({
      id: item.id,
      title: item.name,
      content: item.description,
      imageUrl: resolveImageUrl(item),
      createdAt: item.created_at,
    })
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => {
            const imageSrc = resolveImageUrl(item)

            return (
              <EventGridCard
                key={item.id}
                title={item.name}
                description={item.description}
                imageSrc={imageSrc}
                dateLabel={formatDate(item.created_at)}
                editSlot={
                  isAdmin ? (
                    <EventEditModalButton
                      item={item}
                      onUpdated={handleItemUpdated}
                      onDeleted={handleItemDeleted}
                    />
                  ) : undefined
                }
                onOpen={() => openDetail(item)}
              />
            )
          })}
        </div>
      )}

      <EventDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  )
}
