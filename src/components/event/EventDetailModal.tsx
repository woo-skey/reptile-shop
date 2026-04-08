'use client'

import { useEffect } from 'react'

export type EventDetailModalItem = {
  id: string
  title: string
  content?: string | null
  imageUrl?: string | null
  createdAt?: string
}

const formatDate = (date?: string) => {
  if (!date) return null
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export default function EventDetailModal({
  item,
  onClose,
}: {
  item: EventDetailModalItem | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!item) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [item, onClose])

  if (!item) return null

  const dateLabel = formatDate(item.createdAt)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
        onClick={(event) => event.stopPropagation()}
      >
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full aspect-[4/3] object-cover border-b"
            style={{ borderColor: 'rgba(201,162,39,0.2)' }}
          />
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3
              className="text-lg font-semibold break-words"
              style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
            >
              {item.title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-2 py-1 rounded border shrink-0"
              style={{ color: 'var(--foreground)', opacity: 0.7, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              닫기
            </button>
          </div>

          {dateLabel && (
            <p className="text-xs mb-3" style={{ color: '#C9A227', opacity: 0.8 }}>
              {dateLabel}
            </p>
          )}

          <p
            className="text-sm whitespace-pre-line break-words"
            style={{ color: 'var(--foreground)', opacity: 0.82, lineHeight: 1.6 }}
          >
            {item.content?.trim() || '내용이 없습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}
