import Link from 'next/link'
import { connection } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import NoticeCreateLink from '@/components/notice/NoticeCreateLink'
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

const buildPageHref = (page: number) => (page <= 1 ? '/notice' : `/notice?page=${page}`)

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  await connection()

  const supabase = createPublicClient()
  const resolvedSearchParams = await searchParams
  const requestedPage = toPositiveInt(resolvedSearchParams.page)

  const fetchNoticesByPage = async (page: number) => {
    const from = (page - 1) * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    return supabase
      .from('posts')
      .select('id, title, content, created_at, is_pinned, profiles(display_name)', { count: 'exact' })
      .eq('type', 'notice')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to)
  }

  const firstResult = await fetchNoticesByPage(requestedPage)
  let data = firstResult.data
  const totalNotices = firstResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalNotices / PAGE_SIZE))

  let currentPage = requestedPage
  if (totalNotices > 0 && requestedPage > totalPages) {
    currentPage = totalPages
    const retry = await fetchNoticesByPage(currentPage)
    data = retry.data
  }

  const notices = (data ?? []) as unknown as Post[]
  const pageNumbers = getPaginationWindow(currentPage, totalPages)

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}>
            공지사항
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
            파충류가게 공지입니다.
          </p>
        </div>
        <NoticeCreateLink />
      </div>

      {notices.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            등록된 공지가 없습니다.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {notices.map((notice) => (
              <Link
                key={notice.id}
                href={`/notice/${notice.id}`}
                className="glass-card block px-5 py-4 transition-all hover:border-[rgba(201,162,39,0.4)]"
              >
                <div className="flex items-center gap-2 mb-1">
                  {notice.is_pinned && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(201, 162, 39, 0.15)', color: '#C9A227' }}
                    >
                      고정
                    </span>
                  )}
                  <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {notice.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1.5" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                  <span>{(notice.profiles as unknown as { display_name: string })?.display_name}</span>
                  <span>·</span>
                  <span>{new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="공지 페이지 이동">
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