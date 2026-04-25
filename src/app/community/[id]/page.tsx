import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CommentSection from '@/components/community/CommentSection'
import DeletePostButton from '@/components/community/DeletePostButton'
import type { Post, Comment, Profile } from '@/types'

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: postData } = await supabase
    .from('posts')
    .select('*, profiles(display_name, username)')
    .eq('id', id)
    .eq('type', 'community')
    .single()

  if (!postData) notFound()

  const post = postData as unknown as Post & { profiles: Pick<Profile, 'display_name' | 'username'> }

  const { data: commentData } = await supabase
    .from('comments')
    .select('*, profiles(display_name, username)')
    .eq('post_id', id)
    .order('created_at', { ascending: true })
    .limit(500)

  const comments = (commentData ?? []) as unknown as Comment[]

  const { data: { user } } = await supabase.auth.getUser()

  const imageUrls = post.image_urls?.length
    ? await (async () => {
        const { data } = await supabase.storage
          .from('post-images')
          .createSignedUrls(post.image_urls, 3600)
        return (data ?? [])
          .map((entry) => entry.signedUrl)
          .filter((url): url is string => Boolean(url))
      })()
    : []

  const canManage = user?.id === post.author_id
  const authorName = post.profiles?.display_name ?? post.profiles?.username ?? '알 수 없음'
  const authorUsername = post.profiles?.username ?? null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <article className="glass-card px-6 py-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              {authorUsername ? (
                <Link href={`/u/${authorUsername}`} className="hover:underline">
                  {authorName}
                </Link>
              ) : (
                <span>{authorName}</span>
              )}
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',  year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/community/${post.id}/edit`}
                className="text-xs px-3 py-1.5 rounded-md border"
                style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
              >
                수정
              </Link>
              <DeletePostButton postId={post.id} redirectTo="/community" />
            </div>
          )}
        </div>

        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-6">
            {imageUrls.map((url, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={url}
                alt={`첨부 이미지 ${i + 1}`}
                className="max-w-full rounded-lg"
                style={{ maxHeight: '400px', border: '1px solid rgba(201, 162, 39, 0.2)' }}
              />
            ))}
          </div>
        )}

        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: 'var(--foreground)', opacity: 0.8 }}
        >
          {post.content}
        </div>
      </article>

      <CommentSection postId={post.id} initialComments={comments} currentUserId={user?.id} />
    </div>
  )
}
