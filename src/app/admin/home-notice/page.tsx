import HomeNoticeBannerForm from '@/components/admin/HomeNoticeBannerForm'
import { createClient } from '@/lib/supabase/server'
import type { BannerAlign, HomeNoticeBanner } from '@/types'

const isHomeNoticeTableMissingError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('home_notice_banner') && (
    normalized.includes('does not exist') ||
    normalized.includes('schema cache') ||
    normalized.includes('relation')
  )
}

const toBannerAlign = (value: string | null | undefined): BannerAlign => {
  if (value === 'left' || value === 'center' || value === 'right') return value
  return 'center'
}

export default async function AdminHomeNoticePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('home_notice_banner')
    .select('key, title, content, created_at, updated_at')
    .eq('key', 'main')
    .maybeSingle()

  if (error && isHomeNoticeTableMissingError(error.message)) {
    return (
      <div className="glass-card px-5 py-6">
        <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          메인 공지 배너
        </h2>
        <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.65 }}>
          `home_notice_banner` 테이블이 아직 없습니다.
        </p>
        <p className="text-xs mt-2" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          `sql/add_home_notice_banner.sql`을 Supabase SQL Editor에서 실행해 주세요.
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card px-5 py-6">
        <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          메인 공지 배너
        </h2>
        <p className="text-sm text-red-400">{error.message}</p>
      </div>
    )
  }

  const banner = (data ?? null) as HomeNoticeBanner | null

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
          메인 공지 배너
        </h2>
        <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
          홈 배너 아래에 공지 영역으로 노출됩니다. 제목 없이 내용만 노출되며, 정렬을 선택할 수 있습니다.
        </p>
      </div>

      <HomeNoticeBannerForm
        initialContent={banner?.content ?? ''}
        initialAlign={toBannerAlign(banner?.title)}
      />
    </div>
  )
}
