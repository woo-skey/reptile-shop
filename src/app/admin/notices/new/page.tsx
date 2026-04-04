'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function NewNoticePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('posts').insert({
      author_id: user.id,
      type: 'notice',
      title,
      content,
      is_pinned: isPinned,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/notice')
    router.refresh()
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
        공지 작성
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            제목
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목을 입력하세요"
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
            placeholder="공지 내용을 입력하세요"
            rows={10}
            className="glass-input w-full px-4 py-3 text-sm resize-none"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="pinned"
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="pinned" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
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
            className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            {loading ? '등록 중...' : '공지 등록'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm"
            style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}