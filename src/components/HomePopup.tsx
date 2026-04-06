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

      if (storedValue === todayKey) {
        hiddenByStorage = true
      } else if (storedValue === '1') {
        // 이전 "다시 보지 않기" 값을 "오늘 하루 보지 않기" 형식으로 자동 전환
        localStorage.setItem(storageKey, todayKey)
        hiddenByStorage = true
      } else {
        hiddenByStorage = false
      }
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
        {/* 이미지 */}
        {popup.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={popup.image_url}
            alt={popup.title}
            className="w-full object-cover"
            style={{ maxHeight: '280px' }}
          />
        )}

        <div className="p-6 text-center">
          {/* 장식선 */}
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

          <h2
            className="text-xl font-bold mb-3"
            style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
          >
            {popup.title}
          </h2>

          {popup.content && (
            <p
              className="text-sm leading-relaxed mb-6 whitespace-pre-wrap"
              style={{ color: 'var(--foreground)', opacity: 0.7 }}
            >
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
              오늘 하루 보지 않기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
