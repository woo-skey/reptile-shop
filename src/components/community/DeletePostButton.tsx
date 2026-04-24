'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDialogs } from '@/components/providers/DialogProvider'

export default function DeletePostButton({ postId, redirectTo }: { postId: string; redirectTo: string }) {
  const router = useRouter()
  const dialogs = useDialogs()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const ok = await dialogs.confirm({ message: '게시글을 삭제하시겠습니까?', variant: 'danger' })
    if (!ok) return
    setLoading(true)

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '게시글 삭제에 실패했습니다.' }))
        await dialogs.alert(data.error ?? '게시글 삭제에 실패했습니다.')
        return
      }

      router.push(redirectTo)
    } catch {
      await dialogs.alert('네트워크 오류로 게시글 삭제에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-md border shrink-0 disabled:opacity-50"
      style={{ color: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}
