'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error(error)
    }
  }, [error])

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="glass-card p-8 text-center">
        <p className="text-xs tracking-[0.24em] mb-3" style={{ color: '#C9A227', opacity: 0.85 }}>
          ERROR
        </p>
        <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          일시적인 오류가 발생했습니다.
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
          잠시 후 다시 시도해 주세요.
        </p>

        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm border"
            style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm border"
            style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.25)', opacity: 0.75 }}
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}
