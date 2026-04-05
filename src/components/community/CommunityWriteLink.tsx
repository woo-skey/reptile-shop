'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  variant: 'header' | 'empty'
}

export default function CommunityWriteLink({ variant }: Props) {
  const { user } = useAuth()

  if (!user) return null

  if (variant === 'empty') {
    return (
      <Link
        href="/community/new"
        prefetch
        className="inline-block mt-4 text-sm underline"
        style={{ color: '#C9A227' }}
      >
        湲?곌린
      </Link>
    )
  }

  return (
    <Link
      href="/community/new"
      prefetch
      className="px-4 py-2 rounded-lg text-sm font-medium"
      style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
    >
      湲?곌린
    </Link>
  )
}
