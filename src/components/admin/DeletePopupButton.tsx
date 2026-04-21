'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeletePopupButton({ popupId }: { popupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('이 팝업을 삭제할까요?')) return
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/popups/${popupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '팝업 삭제에 실패했습니다.' }))
        alert(data.error ?? '팝업 삭제에 실패했습니다.')
        setLoading(false)
        return
      }

      router.refresh()
      setLoading(false)
    } catch {
      alert('네트워크 오류로 팝업 삭제에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-md border shrink-0 disabled:opacity-50"
      style={{ color: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      {loading ? '삭제 중...' : '삭제'}
    </button>
  )
}
