'use client'

import { useState } from 'react'

interface PopupData {
  id: string
  title: string
  content: string | null
  image_url: string | null
}

const STORAGE_KEY = 'reptile_popup_hidden_v'
const toLocalDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function HomePopup({ popup }: { popup: PopupData | null }) {
  const [sessionHidden, setSessionHidden] = useState<Record<string, boolean>>({})

  if (!popup) return null

  let hiddenByStorage = false
  if (typeof window !== 'undefined') {
    try {
      const storageKey = STORAGE_KEY + popup.id
      const todayKey = toLocalDateKey(new Date())
      const storedValue = localStorage.getItem(storageKey)
      hiddenByStorage = storedValue === todayKey
    } catch {
      hiddenByStorage = false
    }
  }

  const hiddenInSession = Boolean(sessionHidden[popup.id])
  if (hiddenByStorage || hiddenInSession) return null

  const handleClose = () => {
    setSessionHidden((prev) => ({ ...prev, [popup.id]: true }))
  }

  const handleDontShowAgain = () => {
    try {
      localStorage.setItem(STORAGE_KEY + popup.id, toLocalDateKey(new Date()))
    } catch {
      // noop
    }
    setSessionHidden((prev) => ({ ...prev, [popup.id]: true }))
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="glass-card w-full max-w-sm overflow-hidden"
        style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {popup.image_url && (
          <div className="w-full aspect-square overflow-hidden" style={{ borderBottom: '1px solid rgba(201, 162, 39, 0.18)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={popup.image_url} alt={popup.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-8" style={{ backgroundColor: '#C9A227', opacity: 0.5 }} />
            <span
              className="text-xs tracking-widest uppercase"
              style={{ color: '#C9A227', fontFamily: 'var(--font-im-fell)', opacity: 0.8 }}
            >
              Notice
            </span>
            <div className="h-px w-8" style={{ backgroundColor: '#C9A227', opacity: 0.5 }} />
          </div>

          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}>
            {popup.title}
          </h2>

          {popup.content && (
            <p className="text-sm leading-relaxed mb-6 whitespace-pre-wrap" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              {popup.content}
            </p>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
            >
              닫기
            </button>
            <button
              onClick={handleDontShowAgain}
              className="w-full py-2 text-xs"
              style={{ color: 'var(--foreground)', opacity: 0.35 }}
            >
              오늘 다시 보지 않기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
