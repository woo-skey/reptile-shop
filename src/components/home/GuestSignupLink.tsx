'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function GuestSignupLink() {
  const { user, loading } = useAuth()

  if (loading || user) return null

  return (
    <div className="text-center">
      <Link href="/signup" prefetch className="text-xs underline" style={{ color: '#C9A227', opacity: 0.75 }}>
        가입하고 커뮤니티에 글 남기기
      </Link>
    </div>
  )
}
