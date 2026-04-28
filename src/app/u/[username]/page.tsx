import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Post, Profile } from '@/types'

type ProfileCommentRow = {
  id: string
  content: string
  created_at: string
  posts: { id: string; type: 'community' | 'notice'; title: string } | null
}

const formatJoined = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

const formatShort = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'short',
    day: 'numeric',
  })

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  const cleanUsername = decodeURIComponent(username).trim()
  if (!cleanUsername) notFound()

  const supabase = await createClient()

  const { data: profileData } = await supabase
    .from('profiles')
    .select('id, username, display_name, role, created_at')
    .eq('username', cleanUsername)
    .maybeSingle()

  if (!profileData) notFound()
  const profile = profileData as Profile

  const [{ data: postsData }, { data: commentsData }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, created_at, type')
      .eq('author_id', profile.id)
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('comments')
      .select('id, content, created_at, posts(id, type, title)')
      .eq('author_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const posts = (postsData ?? []) as unknown as Post[]
  const comments = (commentsData ?? []) as unknown as ProfileCommentRow[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="glass-card px-6 py-6 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: '#456132', color: '#F5D76E', border: '2px solid #C9A227' }}
          >
            {profile.display_name?.[0] ?? profile.username[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <h1
              className="text-xl font-bold truncate"
              style={{ color: 'var(--foreground)' }}
            >
              {profile.display_name ?? profile.username}
            </h1>
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              @{profile.username}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              {profile.role === 'admin' ? '관리자' : '단골'}
              <span className="mx-1.5">·</span>
              {formatJoined(profile.created_at)} 가입
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
          <span aria-hidden="true" style={{ color: '#C9A227' }}>·</span> 게시글 ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <div className="glass-card py-10 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              작성한 게시글이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="glass-card flex items-center justify-between px-5 py-3 hover:border-[rgba(201,162,39,0.4)] transition-all"
              >
                <span className="text-sm break-keep min-w-0" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                  {post.title}
                </span>
                <span className="text-xs shrink-0 ml-4" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {formatShort(post.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
          <span aria-hidden="true" style={{ color: '#C9A227' }}>·</span> 댓글 ({comments.length})
        </h2>
        {comments.length === 0 ? (
          <div className="glass-card py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              작성한 댓글이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {comments.map((c) => {
              const post = c.posts
              const href = post ? `/${post.type}/${post.id}` : '#'
              return (
                <Link
                  key={c.id}
                  href={href}
                  className="glass-card block px-5 py-3 hover:border-[rgba(201,162,39,0.4)] transition-all"
                >
                  <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                    {c.content}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                    {post ? (
                      <span className="break-keep">↳ {post.title}</span>
                    ) : (
                      <span>(삭제된 게시글)</span>
                    )}
                    <span>·</span>
                    <span>{formatShort(c.created_at)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
