'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ToggleNoticePinButton({
  postId,
  initialPinned,
}: {
  postId: string
  initialPinned: boolean
}) {
  const router = useRouter()
  const [pinned, setPinned] = useState(initialPinned)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    const next = !pinned
    setLoading(true)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: next }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '고정 설정에 실패했습니다.' }))
        alert(data.error ?? '고정 설정에 실패했습니다.')
        setLoading(false)
        return
      }

      setPinned(next)
      router.refresh()
    } catch {
      alert('네트워크 오류로 고정 설정에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded-md border shrink-0 disabled:opacity-50"
      style={
        pinned
          ? { color: '#1A1A0F', backgroundColor: '#C9A227', borderColor: '#C9A227', fontWeight: 700 }
          : { color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }
      }
    >
      {loading ? '처리 중' : pinned ? '고정됨' : '고정'}
    </button>
  )
}
