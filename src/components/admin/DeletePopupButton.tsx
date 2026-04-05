'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DeletePopupButton({ popupId }: { popupId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm('팝업을 삭제하시겠습니까?')) return
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('popups')
        .delete()
        .eq('id', popupId)

      if (error) {
        alert(error.message)
        setLoading(false)
        return
      }

      router.refresh()
    } catch {
      alert('네트워크 오류로 팝업 삭제에 실패했습니다.')
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
