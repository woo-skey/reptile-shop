import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Post, Profile } from '@/types'

export default async function MyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile

  const { data: postsData } = await supabase
    .from('posts')
    .select('id, title, created_at, type')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  const posts = (postsData ?? []) as unknown as Post[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
      >
        마이페이지
      </h1>

      {/* 프로필 카드 */}
      <div className="glass-card px-6 py-6 mb-6">
        <div className="flex items-center gap-4">
          {/* 아바타 */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: '#456132', color: '#F5D76E', border: '2px solid #C9A227' }}
          >
            {profile?.display_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
              {profile?.display_name}
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              @{profile?.username}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
              {profile?.role === 'admin' ? '관리자' : '단골'}
              <span className="mx-1.5">·</span>
              {new Date(profile?.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 가입
            </p>
          </div>
        </div>
      </div>

      {/* 내 게시글 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: '#C9A227' }}>·</span> 내 게시글 ({posts.length})
          </h2>
        </div>

        {posts.length === 0 ? (
          <div className="glass-card py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              작성한 게시글이 없습니다.
            </p>
            <Link
              href="/community/new"
              className="inline-block mt-3 text-sm underline"
              style={{ color: '#C9A227' }}
            >
              첫 글 쓰러 가기
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.type}/${post.id}`}
                className="glass-card flex items-center justify-between px-5 py-3.5 hover:border-[rgba(201,162,39,0.4)] transition-all"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: post.type === 'notice' ? 'rgba(201, 162, 39, 0.15)' : 'rgba(69, 97, 50, 0.3)',
                      color: post.type === 'notice' ? '#C9A227' : '#9acd6a',
                    }}
                  >
                    {post.type === 'notice' ? '공지' : '커뮤니티'}
                  </span>
                  <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                    {post.title}
                  </span>
                </div>
                <span className="text-xs ml-4 shrink-0" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
