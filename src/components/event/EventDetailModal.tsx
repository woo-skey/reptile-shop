'use client'

import { useRef } from 'react'
import { useDialog } from '@/hooks/useDialog'

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
  return parsed.toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', 
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
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const { dialogRef, titleId } = useDialog({
    isOpen: Boolean(item),
    onClose,
    initialFocusRef: closeButtonRef,
  })

  if (!item) return null

  const dateLabel = formatDate(item.createdAt)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.72)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="glass-modal relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-[#F5F0E8] dark:bg-[#1A1A0F]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full border text-sm font-bold"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            color: '#F5F0E8',
            borderColor: 'rgba(245, 240, 232, 0.65)',
            lineHeight: 1,
          }}
        >
          ×
        </button>

        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full aspect-square object-cover border-b"
            style={{ borderColor: 'rgba(201,162,39,0.2)' }}
          />
        )}

        <div className="p-5 sm:p-6">
          <div className="mb-3">
            <h3
              id={titleId}
              className="text-lg font-semibold break-keep"
              style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
            >
              {item.title}
            </h3>
          </div>

          {dateLabel && (
            <p className="text-xs mb-3" style={{ color: '#C9A227', opacity: 0.8 }}>
              {dateLabel}
            </p>
          )}

          <p
            className="text-sm whitespace-pre-line break-keep"
            style={{ color: 'var(--foreground)', opacity: 0.82, lineHeight: 1.6 }}
          >
            {item.content?.trim() || '내용이 없습니다.'}
          </p>
        </div>
      </div>
    </div>
  )
}
