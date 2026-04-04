import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Post } from '@/types'

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, content, created_at, image_urls, profiles(display_name, username)')
    .eq('type', 'community')
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as unknown as Post[]

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}>
            커뮤니티
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            단골들의 이야기
          </p>
        </div>
        {user && (
          <Link
            href="/community/new"
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* 게시글 목록 */}
      {posts.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </p>
          {user && (
            <Link
              href="/community/new"
              className="inline-block mt-4 text-sm underline"
              style={{ color: '#C9A227' }}
            >
              글쓰기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}`}
              className="glass-card block px-5 py-4 transition-all hover:border-[rgba(201,162,39,0.4)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                    {post.title}
                  </h2>
                  <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                    {post.content}
                  </p>
                </div>
                {post.image_urls?.length > 0 && (
                  <span className="text-xs shrink-0" style={{ color: '#C9A227', opacity: 0.7 }}>
                    사진
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-2.5">
                <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {(post.profiles as unknown as { display_name: string })?.display_name}
                </span>
                <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.25 }}>·</span>
                <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
