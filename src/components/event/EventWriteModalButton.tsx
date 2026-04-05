'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MenuItem } from '@/types'

export default function EventWriteModalButton({
  onCreated,
}: {
  onCreated?: (item: MenuItem) => void
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setOpen(false)
    setError('')
    setLoading(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      category: 'event_post',
      name: title,
      description: content || null,
      sort_order: Number.parseInt(sortOrder, 10) || 0,
      is_available: isAvailable,
      subcategory: null,
      note: null,
      abv: null,
      volume_ml: null,
      price: null,
      price_glass: null,
      price_bottle: null,
      image_url: null,
    }

    const res = await fetch('/api/admin/menu-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '이벤트 등록에 실패했습니다.' }))
      setError(data.error ?? '이벤트 등록에 실패했습니다.')
      setLoading(false)
      return
    }

    const data = await res.json().catch(() => null)
    if (data?.item) {
      onCreated?.(data.item as MenuItem)
    }
    close()
    setTitle('')
    setContent('')
    setSortOrder('0')
    setIsAvailable(true)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
      >
        이벤트 작성
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-6 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div
            className="glass-card w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto p-4 sm:p-6 md:p-7"
            style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                이벤트 작성
              </h3>
              <button
                onClick={close}
                className="text-xs px-2 py-1 rounded border"
                style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                  제목 *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="glass-input w-full px-3 py-2 text-sm resize-none"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm"
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="event-create-available"
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <label htmlFor="event-create-available" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                    이벤트 페이지 노출
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? '등록 중...' : '등록하기'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm"
                  style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
