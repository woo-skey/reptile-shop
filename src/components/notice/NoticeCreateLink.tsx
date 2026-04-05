'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function NoticeCreateLink() {
  const { isAdmin } = useAuth()

  if (!isAdmin) return null

  return (
    <Link
      href="/notice/new"
      prefetch
      className="px-4 py-2 rounded-lg text-sm font-medium"
      style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
    >
      공지 추가
    </Link>
  )
}
