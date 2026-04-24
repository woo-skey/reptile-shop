import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-8">
        <h1
          className="text-xl font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          관리자 패널
        </h1>
      </div>

      {/* 관리자 서브 네비 */}
      <nav className="flex gap-3 mb-8 flex-wrap">
        {[
          { href: '/admin', label: '대시보드' },
          { href: '/admin/users', label: '회원 관리' },
          { href: '/admin/posts', label: '커뮤니티 관리' },
          { href: '/admin/notices', label: '공지 관리' },
          { href: '/admin/menu', label: '메뉴 관리' },
          { href: '/admin/home-notice', label: '메인 공지 배너' },
          { href: '/admin/main-banner', label: '메인 배너 이미지' },
          { href: '/admin/popup', label: '팝업 관리' },
          { href: '/admin/store-info', label: '매장 정보' },
        ].map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-xs px-3 py-1.5 rounded-md border transition-colors"
            style={{ color: 'rgba(245, 240, 232, 0.7)', borderColor: 'rgba(201, 162, 39, 0.3)' }}
          >
            {label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  )
}
