import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DisplayNameEditor from '@/components/mypage/DisplayNameEditor'
import OrderHistoryList, { type OrderHistoryRow } from '@/components/mypage/OrderHistoryList'
import type { Post, Profile } from '@/types'

type MyCommentRow = {
  id: string
  content: string
  created_at: string
  post_id: string
  posts: { id: string; type: 'community' | 'notice'; title: string } | null
}

export default async function MyPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileData },
    { data: postsData },
    { data: commentsData },
    { data: ordersData },
    { data: favoritesData },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, display_name, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('posts')
      .select('id, title, created_at, type')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('comments')
      .select('id, content, created_at, post_id, posts(id, type, title)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('order_history')
      .select('id, items, total, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('menu_favorites')
      .select('created_at, menu_items(id, name, category, price, price_glass, price_bottle)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  const profile = profileData as Profile
  const posts = (postsData ?? []) as unknown as Post[]
  const comments = (commentsData ?? []) as unknown as MyCommentRow[]
  const orders = (ordersData ?? []) as unknown as OrderHistoryRow[]
  const favorites = (favoritesData ?? []) as unknown as Array<{
    created_at: string
    menu_items: {
      id: string
      name: string
      category: string
      price: number | null
      price_glass: number | null
      price_bottle: number | null
    } | null
  }>
  const favoriteList = favorites.filter((f) => f.menu_items != null)

  const formatFavoritePrice = (m: NonNullable<(typeof favoriteList)[number]['menu_items']>) => {
    if (m.price != null) return `${m.price.toLocaleString()}원`
    const parts: string[] = []
    if (m.price_glass != null) parts.push(`잔 ${m.price_glass.toLocaleString()}원`)
    if (m.price_bottle != null) parts.push(`병 ${m.price_bottle.toLocaleString()}원`)
    return parts.join(' / ') || '-'
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
      >
        마이페이지
      </h1>

      <div className="glass-card px-6 py-6 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ backgroundColor: '#456132', color: '#F5D76E', border: '2px solid #C9A227' }}
          >
            {profile?.display_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <DisplayNameEditor initialName={profile?.display_name ?? ''} />
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
              @{profile?.username}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
              {profile?.role === 'admin' ? '관리자' : '단골'}
              <span className="mx-1.5">·</span>
              {new Date(profile?.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',  year: 'numeric', month: 'long', day: 'numeric' })} 가입
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
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
                  <span className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                    {post.title}
                  </span>
                </div>
                <span className="text-xs ml-4 shrink-0" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {new Date(post.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',  month: 'short', day: 'numeric' })}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: '#C9A227' }}>·</span> 즐겨찾는 메뉴 ({favoriteList.length})
          </h2>
        </div>

        {favoriteList.length === 0 ? (
          <div className="glass-card py-10 text-center">
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
              아직 즐겨찾기한 메뉴가 없습니다.
            </p>
            <Link
              href="/menu"
              className="inline-block mt-3 text-sm underline"
              style={{ color: '#C9A227' }}
            >
              메뉴 보러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {favoriteList.map((f) => {
              const m = f.menu_items!
              return (
                <Link
                  key={m.id}
                  href={`/menu?tab=${m.category}`}
                  className="glass-card flex items-center justify-between px-4 py-3 hover:border-[rgba(201,162,39,0.4)] transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                      {m.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#C9A227', opacity: 0.75 }}>
                      {formatFavoritePrice(m)}
                    </p>
                  </div>
                  <span style={{ color: '#C9A227' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: '#C9A227' }}>·</span> 주문 기록 ({orders.length})
          </h2>
        </div>
        <OrderHistoryList initialOrders={orders} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: '#C9A227' }}>·</span> 내 댓글 ({comments.length})
          </h2>
        </div>

        {comments.length === 0 ? (
          <div className="glass-card py-10 text-center">
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
                  className="glass-card block px-5 py-3.5 hover:border-[rgba(201,162,39,0.4)] transition-all"
                >
                  <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.85 }}>
                    {c.content}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                    {post ? (
                      <span className="break-keep">↳ {post.title}</span>
                    ) : (
                      <span>(삭제된 게시글)</span>
                    )}
                    <span>·</span>
                    <span>
                      {new Date(c.created_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul',  month: 'short', day: 'numeric' })}
                    </span>
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
