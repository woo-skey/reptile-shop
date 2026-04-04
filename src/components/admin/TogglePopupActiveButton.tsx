'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
    const supabase = createClient()
    const { error } = await supabase
      .from('popups')
      .update({ is_active: nextValue })
      .eq('id', popupId)

    if (error) {
      alert(error.message)
      setLoading(false)
      return
    }

    setIsActive(nextValue)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
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
