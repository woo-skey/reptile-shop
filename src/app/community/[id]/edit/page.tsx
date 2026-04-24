import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import PostEditForm from '@/components/community/PostEditForm'
import type { Post } from '@/types'

export default async function CommunityPostEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: postData }] = await Promise.all([
    supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('posts')
      .select('id, author_id, type, title, content, image_urls')
      .eq('id', id)
      .eq('type', 'community')
      .maybeSingle(),
  ])

  if (!postData) notFound()

  const post = postData as Pick<Post, 'id' | 'author_id' | 'title' | 'content' | 'image_urls'>
  const canEdit = post.author_id === user.id || profile?.role === 'admin'
  if (!canEdit) {
    redirect(`/community/${id}`)
  }

  const initialImagePaths = Array.isArray(post.image_urls)
    ? post.image_urls.filter((v): v is string => typeof v === 'string' && v.length > 0)
    : []

  const { data: signedData } = initialImagePaths.length
    ? await supabase.storage.from('post-images').createSignedUrls(initialImagePaths, 3600)
    : { data: [] as Array<{ path?: string | null; signedUrl?: string | null }> }

  const initialImages = (signedData ?? [])
    .map((entry) => ({ path: entry.path ?? '', url: entry.signedUrl ?? null }))
    .filter((img): img is { path: string; url: string } => Boolean(img.path && img.url))

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href={`/community/${id}`}
        className="text-xs mb-6 inline-flex items-center gap-1"
        style={{ color: '#C9A227', opacity: 0.7 }}
      >
        ← 게시글로 돌아가기
      </Link>

      <div className="glass-card p-5 sm:p-6">
        <h1
          className="text-xl sm:text-2xl font-bold mb-5"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          게시글 수정
        </h1>

        <PostEditForm
          postId={post.id}
          initialTitle={post.title}
          initialContent={post.content}
          initialImages={initialImages}
        />
      </div>
    </div>
  )
}
