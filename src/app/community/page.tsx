import Link from 'next/link'
import { connection } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import CommunityWriteLink from '@/components/community/CommunityWriteLink'
import type { Post } from '@/types'

const PAGE_SIZE = 12
const PAGE_WINDOW = 5

const toPositiveInt = (value: string | string[] | undefined, fallback = 1) => {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw ?? String(fallback), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

const getPaginationWindow = (currentPage: number, totalPages: number) => {
  const halfWindow = Math.floor(PAGE_WINDOW / 2)
  let start = Math.max(1, currentPage - halfWindow)
  const end = Math.min(totalPages, start + PAGE_WINDOW - 1)

  if (end - start + 1 < PAGE_WINDOW) {
    start = Math.max(1, end - PAGE_WINDOW + 1)
  }

  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const buildPageHref = (page: number) => (page <= 1 ? '/community' : `/community?page=${page}`)

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  await connection()

  const supabase = createPublicClient()
  const resolvedSearchParams = await searchParams
  const requestedPage = toPositiveInt(resolvedSearchParams.page)

  const fetchPostsByPage = async (page: number) => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    return supabase
      .from('posts')
      .select('id, title, content, created_at, image_urls, profiles(display_name, username)', { count: 'exact' })
      .eq('type', 'community')
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  const firstResult = await fetchPostsByPage(requestedPage)
  let data = firstResult.data
  const totalPosts = firstResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalPosts / PAGE_SIZE))

  let currentPage = requestedPage
  if (totalPosts > 0 && requestedPage > totalPages) {
    currentPage = totalPages
    const retry = await fetchPostsByPage(currentPage)
    data = retry.data
  }

  const posts = (data ?? []) as unknown as Post[]
  const pageNumbers = getPaginationWindow(currentPage, totalPages)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}>
            커뮤니티
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            단골들의 이야기
          </p>
        </div>
        <CommunityWriteLink variant="header" />
      </div>

      {posts.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </p>
          <CommunityWriteLink variant="empty" />
        </div>
      ) : (
        <>
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

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="커뮤니티 페이지 이동">
              {currentPage > 1 ? (
                <Link
                  href={buildPageHref(currentPage - 1)}
                  className="px-2.5 py-1.5 text-xs rounded-md border"
                  style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.28)', opacity: 0.8 }}
                >
                  이전
                </Link>
              ) : (
                <span
                  className="px-2.5 py-1.5 text-xs rounded-md border"
                  style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.18)', opacity: 0.35 }}
                >
                  이전
                </span>
              )}

              {pageNumbers.map((page) => {
                const isActive = page === currentPage
                return (
                  <Link
                    key={page}
                    href={buildPageHref(page)}
                    className="min-w-8 text-center px-2 py-1.5 text-xs rounded-md border"
                    style={
                      isActive
                        ? { color: '#1A1A0F', backgroundColor: '#C9A227', borderColor: '#C9A227', fontWeight: 700 }
                        : { color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.28)', opacity: 0.8 }
                    }
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {page}
                  </Link>
                )
              })}

              {currentPage < totalPages ? (
                <Link
                  href={buildPageHref(currentPage + 1)}
                  className="px-2.5 py-1.5 text-xs rounded-md border"
                  style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.28)', opacity: 0.8 }}
                >
                  다음
                </Link>
              ) : (
                <span
                  className="px-2.5 py-1.5 text-xs rounded-md border"
                  style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.18)', opacity: 0.35 }}
                >
                  다음
                </span>
              )}
            </nav>
          )}
        </>
      )}
    </div>
  )
}