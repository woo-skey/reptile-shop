'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomeNoticeBannerForm({
  initialTitle,
  initialContent,
}: {
  initialTitle: string
  initialContent: string
}) {
  const router = useRouter()

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const visible = content.trim().length > 0

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/home-notice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? '메인 공지 저장에 실패했습니다.')
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      setError('네트워크 오류로 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleHide = async () => {
    if (!confirm('메인 공지 배너를 숨기시겠습니까?')) return

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/home-notice', {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? '메인 공지를 숨길 수 없습니다.')
        setLoading(false)
        return
      }

      setContent('')
      router.refresh()
    } catch {
      setError('네트워크 오류로 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="glass-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          메인 공지 배너 설정
        </h3>
        <span
          className="text-xs px-2 py-1 rounded border"
          style={{
            color: visible ? '#9acd6a' : 'rgba(245,240,232,0.55)',
            borderColor: visible ? 'rgba(154,205,106,0.45)' : 'rgba(201,162,39,0.25)',
            backgroundColor: visible ? 'rgba(69,97,50,0.25)' : 'transparent',
          }}
        >
          {visible ? '노출 중' : '숨김'}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          제목 *
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="공지 제목을 입력하세요"
          className="glass-input w-full px-3 py-2 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          내용 *
        </label>
        <textarea
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지 내용을 입력하세요"
          className="glass-input w-full px-3 py-2 text-sm resize-none"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
        <button
          type="button"
          onClick={handleHide}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          style={{ color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          배너 숨기기
        </button>
      </div>
    </form>
  )
}
