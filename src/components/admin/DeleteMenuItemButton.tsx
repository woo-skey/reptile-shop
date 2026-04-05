'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteMenuItemButton({ itemId }: { itemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('메뉴 아이템을 삭제하시겠습니까?')) return
    setLoading(true)

    const res = await fetch('/api/admin/menu-items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '메뉴 삭제에 실패했습니다.' }))
      alert(data.error ?? '메뉴 삭제에 실패했습니다.')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-md border shrink-0 disabled:opacity-50"
      style={{ color: 'rgba(239,68,68,0.8)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      {loading ? '...' : '삭제'}
    </button>
  )
}
