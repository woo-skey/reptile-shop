'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type NavLink = {
  href: string
  label: string
  isActive?: (pathname: string, tab: string | null) => boolean
}

const navLinks: NavLink[] = [
  { href: '/', label: '홈', isActive: (pathname) => pathname === '/' },
  { href: '/menu', label: '메뉴', isActive: (pathname) => pathname.startsWith('/menu') },
  { href: '/event', label: '이벤트', isActive: (pathname) => pathname.startsWith('/event') },
  { href: '/community', label: '커뮤니티', isActive: (pathname) => pathname.startsWith('/community') },
  { href: '/notice', label: '공지', isActive: (pathname) => pathname.startsWith('/notice') },
]

export default function Header() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, isAdmin, loading } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const currentTab = searchParams.get('tab')

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/')
  }

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'rgba(26, 26, 15, 0.85)',
        borderColor: 'rgba(201, 162, 39, 0.2)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
          >
            파충류가게
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label, isActive }) => {
            const active = isActive ? isActive(pathname, currentTab) : false
            return (
              <Link
                key={href}
                href={href}
                className="text-sm transition-colors"
                style={{
                  color: active ? '#C9A227' : 'rgba(245, 240, 232, 0.7)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="text-sm transition-colors"
              style={{ color: pathname.startsWith('/admin') ? '#C9A227' : 'rgba(245, 240, 232, 0.5)' }}
            >
              관리자
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-16 h-6 rounded-md animate-pulse" style={{ backgroundColor: 'rgba(201,162,39,0.1)' }} />
          ) : user ? (
            <>
              <Link
                href="/mypage"
                className="hidden md:block text-sm"
                style={{ color: 'rgba(245, 240, 232, 0.7)' }}
              >
                마이페이지
              </Link>
              <button
                onClick={handleSignOut}
                className="text-xs px-3 py-1.5 rounded-md border transition-colors"
                style={{
                  color: 'rgba(245, 240, 232, 0.6)',
                  borderColor: 'rgba(201, 162, 39, 0.3)',
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-md border transition-colors"
              style={{
                color: '#C9A227',
                borderColor: 'rgba(201, 162, 39, 0.5)',
              }}
            >
              로그인
            </Link>
          )}

          <button
            className="md:hidden p-1"
            onClick={() => setMenuOpen((v) => !v)}
            style={{ color: 'rgba(245, 240, 232, 0.7)' }}
            aria-label="메뉴"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          className="md:hidden border-t px-4 py-3 space-y-2"
          style={{ borderColor: 'rgba(201, 162, 39, 0.15)', backgroundColor: 'rgba(26, 26, 15, 0.95)' }}
        >
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm"
              style={{ color: 'rgba(245, 240, 232, 0.8)' }}
            >
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm"
              style={{ color: 'rgba(245, 240, 232, 0.6)' }}
            >
              관리자
            </Link>
          )}
          {user && (
            <Link
              href="/mypage"
              onClick={() => setMenuOpen(false)}
              className="block py-2 text-sm"
              style={{ color: 'rgba(245, 240, 232, 0.8)' }}
            >
              마이페이지
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
