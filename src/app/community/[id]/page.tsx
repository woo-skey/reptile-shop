import { notFound } from 'next/navigation'
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

  const comments = (commentData ?? []) as unknown as Comment[]

  const { data: { user } } = await supabase.auth.getUser()

  const imageUrls: string[] = []
  if (post.image_urls?.length > 0) {
    for (const path of post.image_urls) {
      const { data } = await supabase.storage
        .from('post-images')
        .createSignedUrl(path, 3600)
      if (data) imageUrls.push(data.signedUrl)
    }
  }

  const canDelete = user?.id === post.author_id

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <article className="glass-card px-6 py-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              {post.title}
            </h1>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
              <span>{post.profiles.display_name}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
          {canDelete && <DeletePostButton postId={post.id} redirectTo="/community" />}
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
