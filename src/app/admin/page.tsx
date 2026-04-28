import { createClient } from '@/lib/supabase/server'
import DashboardSparkline from '@/components/admin/DashboardSparkline'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

const toKstDateKey = (iso: string) => {
  const d = new Date(new Date(iso).getTime() + KST_OFFSET_MS)
  return d.toISOString().slice(0, 10)
}

const buildDailySeries = (rows: Array<{ created_at: string }>, days: number) => {
  const today = new Date(Date.now() + KST_OFFSET_MS)
  const dayKeys: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - i)
    dayKeys.push(d.toISOString().slice(0, 10))
  }
  const counts = new Map<string, number>(dayKeys.map((k) => [k, 0]))
  for (const row of rows) {
    const key = toKstDateKey(row.created_at)
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return dayKeys.map((k) => ({
    label: k.slice(5).replace('-', '/'),
    value: counts.get(k) ?? 0,
  }))
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: userCount },
    { count: communityCount },
    { count: commentCount },
    { count: noticeCount },
    { data: recentSignups },
    { data: recentPosts },
    { data: recentComments },
    { data: activeUserPosts },
    { data: activeUserComments },
    { data: topPosts },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'community'),
    supabase.from('comments').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('type', 'notice'),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', since30)
      .limit(2000),
    supabase
      .from('posts')
      .select('created_at')
      .eq('type', 'community')
      .gte('created_at', since30)
      .limit(2000),
    supabase
      .from('comments')
      .select('created_at')
      .gte('created_at', since30)
      .limit(5000),
    supabase
      .from('posts')
      .select('author_id')
      .gte('created_at', since7)
      .limit(2000),
    supabase
      .from('comments')
      .select('author_id')
      .gte('created_at', since7)
      .limit(5000),
    supabase
      .from('posts')
      .select('id, title, type, created_at, profiles(display_name, username)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const signupSeries = buildDailySeries(recentSignups ?? [], 30)
  const postSeries = buildDailySeries(recentPosts ?? [], 30)
  const commentSeries = buildDailySeries(recentComments ?? [], 30)

  const activeUserIds = new Set<string>()
  for (const r of activeUserPosts ?? []) {
    const id = (r as { author_id?: string | null }).author_id
    if (id) activeUserIds.add(id)
  }
  for (const r of activeUserComments ?? []) {
    const id = (r as { author_id?: string | null }).author_id
    if (id) activeUserIds.add(id)
  }

  const stats = [
    { label: '전체 회원', value: userCount ?? 0 },
    { label: '커뮤니티 게시글', value: communityCount ?? 0 },
    { label: '댓글', value: commentCount ?? 0 },
    { label: '공지사항', value: noticeCount ?? 0 },
  ]

  const recentTop = (topPosts ?? []) as unknown as Array<{
    id: string
    title: string
    type: 'community' | 'notice'
    created_at: string
    profiles: { display_name: string | null; username: string | null } | null
  }>

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DashboardSparkline
          title="최근 30일 가입 (KST)"
          points={signupSeries}
          total={(recentSignups ?? []).length}
        />
        <DashboardSparkline
          title="최근 30일 게시글"
          points={postSeries}
          total={(recentPosts ?? []).length}
        />
        <DashboardSparkline
          title="최근 30일 댓글"
          points={commentSeries}
          total={(recentComments ?? []).length}
        />
      </div>

      <div className="glass-card px-5 py-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
            최근 7일 활성 사용자 (글/댓글 작성)
          </span>
          <span className="text-lg font-bold" style={{ color: '#C9A227' }}>
            {activeUserIds.size}명
          </span>
        </div>
        <p className="text-[11px]" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
          이 기간에 게시글이나 댓글을 한 건 이상 작성한 고유 사용자 수입니다.
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
          <span aria-hidden="true" style={{ color: '#C9A227' }}>·</span> 최근 게시글 5건
        </h3>
        <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
          {recentTop.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              아직 게시글이 없습니다.
            </p>
          ) : (
            recentTop.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex items-center gap-2">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded shrink-0"
                    style={{
                      backgroundColor: p.type === 'notice' ? 'rgba(201,162,39,0.15)' : 'rgba(69,97,50,0.3)',
                      color: p.type === 'notice' ? '#C9A227' : '#9acd6a',
                    }}
                  >
                    {p.type === 'notice' ? '공지' : '커뮤니티'}
                  </span>
                  <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                    {p.title}
                  </span>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  {p.profiles?.display_name ?? p.profiles?.username ?? '-'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
