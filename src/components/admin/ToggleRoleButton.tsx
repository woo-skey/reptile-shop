'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/types'

export default function ToggleRoleButton({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (!confirm(currentRole === 'admin' ? '관리자 권한을 해제하시겠습니까?' : '관리자로 지정하시겠습니까?')) return
    setLoading(true)

    await fetch('/api/admin/toggle-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newRole: currentRole === 'admin' ? 'user' : 'admin' }),
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="text-xs px-2.5 py-1 rounded border disabled:opacity-50"
      style={{
        color: currentRole === 'admin' ? 'rgba(239,68,68,0.8)' : 'rgba(201, 162, 39, 0.8)',
        borderColor: currentRole === 'admin' ? 'rgba(239,68,68,0.3)' : 'rgba(201, 162, 39, 0.3)',
      }}
    >
      {loading ? '...' : currentRole === 'admin' ? '권한 해제' : '관리자 지정'}
    </button>
  )
}
