import { createClient } from '@/lib/supabase/server'
import DeletePostButton from '@/components/community/DeletePostButton'
import type { Post, Profile } from '@/types'

export default async function AdminPostsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('posts')
    .select('id, title, type, created_at, profiles(display_name)')
    .order('created_at', { ascending: false })

  const posts = (data ?? []) as unknown as (Post & { profiles: Pick<Profile, 'display_name'> })[]

  return (
    <div>
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        전체 게시글 ({posts.length}개)
      </h2>

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {posts.map((post) => (
          <div key={post.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs px-1.5 py-0.5 rounded shrink-0"
                  style={{
                    backgroundColor: post.type === 'notice' ? 'rgba(201, 162, 39, 0.15)' : 'rgba(69, 97, 50, 0.3)',
                    color: post.type === 'notice' ? '#C9A227' : '#9acd6a',
                  }}
                >
                  {post.type === 'notice' ? '공지' : '커뮤니티'}
                </span>
                <p className="text-sm truncate" style={{ color: 'var(--foreground)' }}>
                  {post.title}
                </p>
              </div>
              <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                {post.profiles?.display_name}
                <span className="mx-1.5">·</span>
                {new Date(post.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
            <DeletePostButton postId={post.id} redirectTo="/admin/posts" />
          </div>
        ))}
      </div>
    </div>
  )
}
