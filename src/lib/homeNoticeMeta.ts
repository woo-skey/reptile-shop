import type { BannerAlign, BannerTextSize } from '@/types'

const ALIGN_OPTIONS: BannerAlign[] = ['left', 'center', 'right']
const SIZE_OPTIONS: BannerTextSize[] = ['md', 'lg', 'xl']

export type HomeNoticeMeta = {
  align: BannerAlign
  size: BannerTextSize
}

export const DEFAULT_HOME_NOTICE_META: HomeNoticeMeta = {
  align: 'center',
  size: 'lg',
}

export const HOME_NOTICE_TEXT_SIZE_CLASS: Record<BannerTextSize, string> = {
  md: 'text-base sm:text-2xl',
  lg: 'text-lg sm:text-3xl',
  xl: 'text-xl sm:text-4xl',
}

export const parseHomeNoticeMeta = (raw: string | null | undefined): HomeNoticeMeta => {
  if (!raw) return DEFAULT_HOME_NOTICE_META

  const value = raw.trim()
  if (!value) return DEFAULT_HOME_NOTICE_META

  // 이전 데이터 호환: title 컬럼에 정렬값만 저장했던 경우
  if (ALIGN_OPTIONS.includes(value as BannerAlign)) {
    return { align: value as BannerAlign, size: DEFAULT_HOME_NOTICE_META.size }
  }

  try {
    const parsed = JSON.parse(value) as Partial<HomeNoticeMeta>
    const align = ALIGN_OPTIONS.includes(parsed.align as BannerAlign)
      ? (parsed.align as BannerAlign)
      : DEFAULT_HOME_NOTICE_META.align
    const size = SIZE_OPTIONS.includes(parsed.size as BannerTextSize)
      ? (parsed.size as BannerTextSize)
      : DEFAULT_HOME_NOTICE_META.size
    return { align, size }
  } catch {
    return DEFAULT_HOME_NOTICE_META
  }
}

export const serializeHomeNoticeMeta = (meta: Partial<HomeNoticeMeta>): string => {
  const align = ALIGN_OPTIONS.includes(meta.align as BannerAlign)
    ? (meta.align as BannerAlign)
    : DEFAULT_HOME_NOTICE_META.align
  const size = SIZE_OPTIONS.includes(meta.size as BannerTextSize)
    ? (meta.size as BannerTextSize)
    : DEFAULT_HOME_NOTICE_META.size

  return JSON.stringify({ align, size })
}
