'use client'

import type { KeyboardEvent, ReactNode } from 'react'

type EventGridCardProps = {
  title: string
  description?: string | null
  imageSrc?: string | null
  dateLabel?: string | null
  editSlot?: ReactNode
  onOpen?: () => void
}

export default function EventGridCard({
  title,
  description,
  imageSrc,
  dateLabel,
  editSlot,
  onOpen,
}: EventGridCardProps) {
  const interactive = Boolean(onOpen)

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!interactive || !onOpen) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  return (
    <article
      className="glass-card relative overflow-hidden flex flex-col text-left"
      style={{ border: '1px solid rgba(201,162,39,0.2)' }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative border-b"
        style={{ borderColor: 'rgba(201,162,39,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}
      >
        {editSlot && (
          <div className="absolute top-2 right-2 z-10" onClick={(event) => event.stopPropagation()}>
            {editSlot}
          </div>
        )}

        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={title}
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

      <div className="p-3 sm:p-4 flex-1 text-left">
        <h3
          className="text-sm sm:text-base font-semibold break-keep text-left"
          style={{ color: 'var(--foreground)', lineHeight: 1.35 }}
        >
          {title}
        </h3>

        {dateLabel && (
          <p className="text-xs mt-1 text-left" style={{ color: '#C9A227', opacity: 0.8 }}>
            {dateLabel}
          </p>
        )}

        {description && (
          <p
            className="text-xs sm:text-sm mt-2 break-keep whitespace-pre-line text-left"
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
            {description}
          </p>
        )}
      </div>
    </article>
  )
}
