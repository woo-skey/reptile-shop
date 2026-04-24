import { createClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: userCount },
    { count: postCount },
    { count: commentCount },
    { count: noticeCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'community'),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'notice'),
  ])

  const stats = [
    { label: '전체 회원', value: userCount ?? 0 },
    { label: '커뮤니티 게시글', value: postCount ?? 0 },
    { label: '댓글', value: commentCount ?? 0 },
    { label: '공지사항', value: noticeCount ?? 0 },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="glass-card px-5 py-5 text-center">
            <p className="text-2xl font-bold mb-1" style={{ color: '#C9A227' }}>
              {value}
            </p>
            <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
