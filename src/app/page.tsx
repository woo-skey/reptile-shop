import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomePopup from '@/components/HomePopup'
import type { Post, MenuItem } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: recentPosts },
    { data: recentNotices },
    { data: eventItems },
    { data: activePopup },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('type', 'notice')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('menu_items')
      .select('id, name, description, price')
      .eq('category', 'event')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .limit(4),
    supabase
      .from('popups')
      .select('id, title, content, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const posts = (recentPosts ?? []) as unknown as Post[]
  const notices = (recentNotices ?? []) as unknown as Post[]
  const events = (eventItems ?? []) as unknown as MenuItem[]

  return (
    <>
      <HomePopup popup={activePopup ?? null} />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* ── 퀵 링크 배너 ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/menu',      label: '메뉴 보기',   sub: 'Menu' },
            { href: '/menu?tab=event', label: '이벤트', sub: 'Event' },
            { href: '/community', label: '커뮤니티',    sub: 'Community' },
            { href: '/notice',    label: '공지사항',    sub: 'Notice' },
          ].map(({ href, label, sub }) => (
            <Link
              key={href}
              href={href}
              className="glass-card flex flex-col items-center justify-center py-5 gap-1 transition-all hover:border-[rgba(201,162,39,0.5)]"
            >
              <span
                className="text-xs tracking-widest uppercase"
                style={{ color: '#C9A227', fontFamily: 'var(--font-im-fell)', opacity: 0.7 }}
              >
                {sub}
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                {label}
              </span>
            </Link>
          ))}
        </section>

        {/* ── 이벤트 / New ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
              <span style={{ color: '#C9A227' }}>·</span> Event / New
            </h2>
            <Link href="/menu?tab=event" className="text-xs" style={{ color: '#C9A227', opacity: 0.8 }}>
              전체보기
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="glass-card px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
              등록된 이벤트가 없습니다.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 items-start">
              {events.map((item) => (
                <div key={item.id} className="glass-card px-4 py-4">
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
                      {item.description}
                    </p>
                  )}
                  {item.price != null && (
                    <p className="text-xs font-medium" style={{ color: '#C9A227' }}>
                      {item.price.toLocaleString()}원
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── 콘텐츠 그리드 ── */}
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {/* 최근 게시글 */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 최근 게시글
              </h2>
              <Link href="/community" className="text-xs" style={{ color: '#C9A227', opacity: 0.8 }}>
                전체보기
              </Link>
            </div>
            <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
              {posts.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  아직 게시글이 없습니다.
                </p>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                      {post.title}
                    </span>
                    <span className="text-xs ml-4 shrink-0" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))
              )}
            </div>
            {!user && (
              <div className="mt-3 text-center">
                <Link href="/signup" className="text-xs underline" style={{ color: '#C9A227', opacity: 0.7 }}>
                  가입하고 글 남기기
                </Link>
              </div>
            )}
          </div>

          {/* 공지사항 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 공지사항
              </h2>
              <Link href="/notice" className="text-xs" style={{ color: '#C9A227', opacity: 0.8 }}>
                전체보기
              </Link>
            </div>
            <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
              {notices.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  공지가 없습니다.
                </p>
              ) : (
                notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/notice/${notice.id}`}
                    className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-white/5"
                  >
                    <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                      {notice.title}
                    </span>
                    <span className="text-xs ml-4 shrink-0" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                      {new Date(notice.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
