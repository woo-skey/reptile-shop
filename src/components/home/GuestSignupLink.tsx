'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function GuestSignupLink() {
  const { user, loading } = useAuth()

  if (loading || user) return null

  return (
    <div className="text-center">
      <Link href="/signup" prefetch className="text-xs underline" style={{ color: '#C9A227', opacity: 0.75 }}>
        媛?낇븯怨?而ㅻ??덊떚??湲 ?④린湲?
      </Link>
    </div>
  )
}
