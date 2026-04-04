import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import HomePopup from '@/components/HomePopup'
import type { Post } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: { user } },
    { data: recentPosts },
    { data: recentNotices },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from('posts')
      .select('id, title, created_at, type, profiles(display_name, username)')
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('posts')
      .select('id, title, created_at, profiles(display_name, username)')
      .eq('type', 'notice')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const posts = (recentPosts ?? []) as unknown as Post[]
  const notices = (recentNotices ?? []) as unknown as Post[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <HomePopup />

      {/* 히어로 */}
      <section className="text-center mb-16">
        <p
          className="text-sm tracking-[0.3em] uppercase mb-3"
          style={{ color: '#C9A227', fontFamily: 'var(--font-im-fell)', opacity: 0.8 }}
        >
          Since whenever
        </p>
        <h1
          className="text-5xl md:text-6xl font-bold mb-4"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          파충류가게
        </h1>
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-16" style={{ backgroundColor: '#C9A227', opacity: 0.4 }} />
          <span className="text-xs tracking-widest" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            단골들만의 공간
          </span>
          <div className="h-px w-16" style={{ backgroundColor: '#C9A227', opacity: 0.4 }} />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/community"
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            커뮤니티 보기
          </Link>
          {!user && (
            <Link
              href="/signup"
              className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ color: '#C9A227', border: '1px solid rgba(201, 162, 39, 0.4)' }}
            >
              가입하기
            </Link>
          )}
        </div>
      </section>

      {/* 콘텐츠 그리드 */}
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
        </div>

        {/* 공지 */}
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
  )
}
