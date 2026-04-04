'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'reptile_popup_hidden'

export default function HomePopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hidden = localStorage.getItem(STORAGE_KEY)
      if (!hidden) setVisible(true)
    }
  }, [])

  const handleClose = () => setVisible(false)

  const handleDontShowAgain = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '1')
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={handleClose}
    >
      <div
        className="glass-card w-full max-w-sm p-8 text-center"
        style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 장식선 */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px w-10" style={{ backgroundColor: '#C9A227', opacity: 0.5 }} />
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: '#C9A227', fontFamily: 'var(--font-im-fell)', opacity: 0.8 }}
          >
            Welcome
          </span>
          <div className="h-px w-10" style={{ backgroundColor: '#C9A227', opacity: 0.5 }} />
        </div>

        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          파충류가게
        </h2>

        <p
          className="text-sm leading-relaxed mb-2"
          style={{ color: 'var(--foreground)', opacity: 0.75 }}
        >
          반갑습니다, 단골님.
        </p>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--foreground)', opacity: 0.55 }}
        >
          인스타그램에서도 만나요.
        </p>

        <a
          href="https://www.instagram.com/reptile_shop2021"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs mb-6 transition-opacity hover:opacity-70"
          style={{ color: '#C9A227' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          @reptile_shop2021
        </a>

        {/* 버튼 */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            닫기
          </button>
          <button
            onClick={handleDontShowAgain}
            className="w-full py-2 text-xs transition-opacity hover:opacity-70"
            style={{ color: 'var(--foreground)', opacity: 0.35 }}
          >
            다시 보지않기
          </button>
        </div>
      </div>
    </div>
  )
}
