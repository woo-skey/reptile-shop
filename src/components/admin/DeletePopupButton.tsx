'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDialogs } from '@/components/providers/DialogProvider'

export default function DeletePopupButton({ popupId }: { popupId: string }) {
  const router = useRouter()
  const dialogs = useDialogs()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    const ok = await dialogs.confirm({ message: '이 팝업을 삭제할까요?', variant: 'danger' })
    if (!ok) return
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/popups/${popupId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '팝업 삭제에 실패했습니다.' }))
        await dialogs.alert(data.error ?? '팝업 삭제에 실패했습니다.')
        setLoading(false)
        return
      }

      router.refresh()
      setLoading(false)
    } catch {
      await dialogs.alert('네트워크 오류로 팝업 삭제에 실패했습니다.')
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
