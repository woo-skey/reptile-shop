'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import EventWriteModalButton from '@/components/event/EventWriteModalButton'
import EventEditModalButton from '@/components/event/EventEditModalButton'
import EventDetailModal, { type EventDetailModalItem } from '@/components/event/EventDetailModal'
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
              <article
                key={item.id}
                className="glass-card overflow-hidden flex flex-col"
                style={{ border: '1px solid rgba(201,162,39,0.2)' }}
                role="button"
                tabIndex={0}
                onClick={() => openDetail(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openDetail(item)
                  }
                }}
              >
                <div
                  className="relative border-b"
                  style={{ borderColor: 'rgba(201,162,39,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}
                >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 z-10" onClick={(event) => event.stopPropagation()}>
                      <EventEditModalButton
                        item={item}
                        onUpdated={handleItemUpdated}
                        onDeleted={handleItemDeleted}
                      />
                    </div>
                  )}

                  {imageSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <span className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                        이미지
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4 flex-1">
                  <h3
                    className="text-sm sm:text-base font-semibold break-words"
                    style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
                  >
                    {item.name}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: '#C9A227', opacity: 0.8 }}>
                    {formatDate(item.created_at)}
                  </p>

                  {item.description && (
                    <p
                      className="text-xs sm:text-sm mt-2 break-words whitespace-pre-line"
                      style={{
                        color: 'var(--foreground)',
                        opacity: 0.78,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.description}
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      <EventDetailModal item={detailItem} onClose={() => setDetailItem(null)} />
    </>
  )
}
