import Link from 'next/link'
import { connection } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import { createPostImagesAdminClient, toRenderablePostImageUrl } from '@/lib/storage/postImages'
import HomePopup from '@/components/HomePopup'
import GuestSignupLink from '@/components/home/GuestSignupLink'
import type { Post, MenuItem } from '@/types'

const MENU_LABELS: Record<string, string> = {
  food: 'Food',
  non_alcohol: 'Non-Alcohol',
  beverage: 'Beverage',
  signature: 'Signature',
  cocktail: 'Cocktail',
  beer: 'Beer',
  wine: 'Wine',
  whisky: 'Whisky',
  shochu: 'Shochu',
  spirits: 'Spirits',
}

const MAIN_HERO_IMAGE = '/reptile_image.png'

export default async function HomePage() {
  await connection()

  const supabase = createPublicClient()

  const [
    { data: recentPosts },
    { data: recentNotices },
    { data: eventItems },
    { data: mainMenuItems },
    { data: activePopup },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('posts')
      .select('id, title, created_at')
      .eq('type', 'notice')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('menu_items')
      .select('id, name, description, created_at')
      .eq('category', 'event_post')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .limit(4),
    supabase
      .from('menu_items')
      .select('id, name, category, price')
      .eq('category', 'food')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(4),
    supabase
      .from('popups')
      .select('id, title, content, image_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const posts = (recentPosts ?? []) as unknown as Post[]
  const notices = (recentNotices ?? []) as unknown as Post[]
  const events = (eventItems ?? []) as unknown as MenuItem[]
  const menus = (mainMenuItems ?? []) as unknown as MenuItem[]
  const storageAdminClient = createPostImagesAdminClient()

  const popup = activePopup
    ? {
        ...activePopup,
        image_url: await toRenderablePostImageUrl(activePopup.image_url, storageAdminClient),
      }
    : null

  return (
    <>
      <HomePopup popup={popup} />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <section>
          <div
            className="w-full aspect-[5/1] overflow-hidden border-y"
            style={{ borderColor: 'rgba(201, 162, 39, 0.25)', backgroundColor: '#1A1A0F' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={MAIN_HERO_IMAGE}
              alt="메인 배너"
              className="w-full h-full object-cover object-center"
            />
          </div>
        </section>
        <section className="grid md:grid-cols-2 gap-6 items-start">
          <div className="glass-card p-5 md:p-6 h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 메인 메뉴
              </h2>
              <Link href="/menu" className="text-lg font-bold leading-none" style={{ color: '#C9A227', opacity: 0.85 }}>
                +
              </Link>
            </div>

            {menus.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  등록된 메뉴가 없습니다.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden divide-y divide-[rgba(201,162,39,0.1)]">
                {menus.map((item) => (
                  <Link
                    key={item.id}
                    href={`/menu?tab=${item.category}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-white/5 px-1 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                        {item.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#C9A227', opacity: 0.75 }}>
                        {MENU_LABELS[item.category] ?? item.category}
                      </p>
                    </div>
                    <span className="text-xs shrink-0 ml-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                      {item.price != null ? `${item.price.toLocaleString()}원` : '-'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5 md:p-6 h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 이벤트
              </h2>
              <Link href="/event" className="text-lg font-bold leading-none" style={{ color: '#C9A227', opacity: 0.85 }}>
                +
              </Link>
            </div>

            {events.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  등록된 이벤트가 없습니다.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden divide-y divide-[rgba(201,162,39,0.1)]">
                {events.map((item) => (
                  <Link
                    key={item.id}
                    href="/event"
                    className="flex items-center justify-between py-3 transition-colors hover:bg-white/5 px-1 rounded"
                  >
                    <div className="min-w-0">
                      <p className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs shrink-0 ml-4" style={{ color: '#C9A227', opacity: 0.9 }}>
                      {new Date(item.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5 md:p-6 h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 최근 게시글
              </h2>
              <Link href="/community" className="text-lg font-bold leading-none" style={{ color: '#C9A227', opacity: 0.85 }}>
                +
              </Link>
            </div>

            {posts.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  아직 게시글이 없습니다.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden divide-y divide-[rgba(201,162,39,0.1)]">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-white/5 px-1 rounded"
                  >
                    <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                      {post.title}
                    </span>
                    <span className="text-xs shrink-0 ml-4" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                      {new Date(post.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-5 md:p-6 h-[280px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                <span style={{ color: '#C9A227' }}>·</span> 공지사항
              </h2>
              <Link href="/notice" className="text-lg font-bold leading-none" style={{ color: '#C9A227', opacity: 0.85 }}>
                +
              </Link>
            </div>

            {notices.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  등록된 공지가 없습니다.
                </p>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden divide-y divide-[rgba(201,162,39,0.1)]">
                {notices.map((notice) => (
                  <Link
                    key={notice.id}
                    href={`/notice/${notice.id}`}
                    className="flex items-center justify-between py-3 transition-colors hover:bg-white/5 px-1 rounded"
                  >
                    <span className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                      {notice.title}
                    </span>
                    <span className="text-xs shrink-0 ml-4" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                      {new Date(notice.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <GuestSignupLink />
      </div>
    </>
  )
}
