'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NoticeEditForm({
  postId,
  initialTitle,
  initialContent,
  initialIsPinned,
}: {
  postId: string
  initialTitle: string
  initialContent: string
  initialIsPinned: boolean
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isPinned, setIsPinned] = useState(initialIsPinned)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, is_pinned: isPinned }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '공지 수정에 실패했습니다.' }))
        setError(data.error ?? '공지 수정에 실패했습니다.')
        setLoading(false)
        return
      }

      router.push(`/notice/${postId}`)
      router.refresh()
    } catch {
      setError('네트워크 오류로 공지 수정에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          제목
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          내용
        </label>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="notice-is-pinned"
          type="checkbox"
          checked={isPinned}
          onChange={(e) => setIsPinned(e.target.checked)}
        />
        <label htmlFor="notice-is-pinned" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
          상단 고정
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          {loading ? '저장 중...' : '수정 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/notice/${postId}`)}
          className="px-6 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
        >
          취소
        </button>
      </div>
    </form>
  )
}
