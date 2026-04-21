'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TogglePopupActiveButton({
  popupId,
  initialActive,
}: {
  popupId: string
  initialActive: boolean
}) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(initialActive)
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)

    const nextValue = !isActive

    try {
      const response = await fetch(`/api/admin/popups/${popupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextValue }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '상태 변경에 실패했습니다.' }))
        alert(data.error ?? '상태 변경에 실패했습니다.')
        setLoading(false)
        return
      }

      setIsActive(nextValue)
      router.refresh()
      setLoading(false)
    } catch {
      alert('네트워크 오류로 상태 변경에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-md border shrink-0 disabled:opacity-50"
      style={{
        color: isActive ? 'rgba(239,68,68,0.85)' : 'rgba(154,205,106,0.9)',
        borderColor: isActive ? 'rgba(239,68,68,0.35)' : 'rgba(154,205,106,0.35)',
      }}
    >
      {loading ? '처리 중...' : isActive ? '비활성화' : '활성화'}
    </button>
  )
}
