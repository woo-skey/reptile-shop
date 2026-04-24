'use client'

import { useEffect, useRef, useState } from 'react'
import { useDialogs } from '@/components/providers/DialogProvider'
import { HOME_NOTICE_TEXT_SIZE_CLASS } from '@/lib/homeNoticeMeta'
import type { BannerAlign, BannerTextSize } from '@/types'

const ALIGN_OPTIONS: { key: BannerAlign; label: string }[] = [
  { key: 'left', label: '왼쪽' },
  { key: 'center', label: '가운데' },
  { key: 'right', label: '오른쪽' },
]

const ALIGN_CLASS: Record<BannerAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

const SIZE_OPTIONS: { key: BannerTextSize; label: string }[] = [
  { key: 'md', label: '기본' },
  { key: 'lg', label: '크게' },
  { key: 'xl', label: '아주 크게' },
]

export default function HomeNoticeBannerForm({
  initialContent,
  initialAlign,
  initialSize,
}: {
  initialContent: string
  initialAlign: BannerAlign
  initialSize: BannerTextSize
}) {
  const dialogs = useDialogs()
  const clearSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [content, setContent] = useState(initialContent)
  const [align, setAlign] = useState<BannerAlign>(initialAlign)
  const [size, setSize] = useState<BannerTextSize>(initialSize)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const visible = content.trim().length > 0

  useEffect(() => {
    return () => {
      if (clearSavedTimer.current) clearTimeout(clearSavedTimer.current)
    }
  }, [])

  useEffect(() => {
    setSaved(false)
  }, [content, align, size])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/home-notice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, align, size }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error ?? '메인 공지 저장에 실패했습니다.')
        setLoading(false)
        return
      }

      setSaved(true)
      if (clearSavedTimer.current) clearTimeout(clearSavedTimer.current)
      clearSavedTimer.current = setTimeout(() => setSaved(false), 1800)
    } catch {
      setError('네트워크 오류로 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleHide = async () => {
    const ok = await dialogs.confirm({ message: '메인 공지 배너를 숨기시겠습니까?', variant: 'danger' })
    if (!ok) return

    setError('')
    setSaved(false)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/home-notice', {
        method: 'DELETE',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? '메인 공지를 숨길 수 없습니다.')
        setLoading(false)
        return
      }

      setContent('')
      setAlign('center')
      setSize('lg')
    } catch {
      setError('네트워크 오류로 처리에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="glass-card p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          메인 공지 배너 설정
        </h3>
        <span
          className="text-xs px-2 py-1 rounded border"
          style={{
            color: visible ? '#9acd6a' : 'rgba(245,240,232,0.55)',
            borderColor: visible ? 'rgba(154,205,106,0.45)' : 'rgba(201,162,39,0.25)',
            backgroundColor: visible ? 'rgba(69,97,50,0.25)' : 'transparent',
          }}
        >
          {visible ? '노출 중' : '숨김'}
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          내용 *
        </label>
        <textarea
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지 내용을 입력하세요"
          className="glass-input w-full px-3 py-2 text-sm resize-none"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          정렬
        </label>
        <div className="inline-flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(201,162,39,0.3)' }}>
          {ALIGN_OPTIONS.map((option) => {
            const active = align === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setAlign(option.key)}
                className="px-3 py-1.5 text-xs border-r last:border-r-0 transition-colors"
                style={{
                  borderColor: 'rgba(201,162,39,0.25)',
                  backgroundColor: active ? 'rgba(69,97,50,0.35)' : 'transparent',
                  color: active ? '#F5F0E8' : 'rgba(245,240,232,0.65)',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          글자 크기
        </label>
        <div className="inline-flex items-center rounded-lg border overflow-hidden" style={{ borderColor: 'rgba(201,162,39,0.3)' }}>
          {SIZE_OPTIONS.map((option) => {
            const active = size === option.key
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setSize(option.key)}
                className="px-3 py-1.5 text-xs border-r last:border-r-0 transition-colors"
                style={{
                  borderColor: 'rgba(201,162,39,0.25)',
                  backgroundColor: active ? 'rgba(69,97,50,0.35)' : 'transparent',
                  color: active ? '#F5F0E8' : 'rgba(245,240,232,0.65)',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="text-xs mb-1.5 opacity-70" style={{ color: 'var(--foreground)' }}>
          미리보기
        </p>
        <div
          className="w-full aspect-[27/2] px-4 sm:px-6 flex items-center border rounded-xl overflow-hidden"
          style={{
            borderColor: 'rgba(201,162,39,0.25)',
            background: 'linear-gradient(90deg, rgba(69,97,50,0.24), rgba(26,26,15,0.65))',
          }}
        >
          <p
            className={`w-full font-semibold truncate ${HOME_NOTICE_TEXT_SIZE_CLASS[size]} ${ALIGN_CLASS[align]}`}
            style={{ color: 'var(--foreground)', opacity: 0.86 }}
          >
            {content.trim() || '내용을 입력하면 이렇게 노출됩니다.'}
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
      {!error && saved && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#9acd6a', backgroundColor: 'rgba(69,97,50,0.25)' }}>
          저장 완료
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: saved ? 'rgba(69,97,50,0.75)' : '#456132',
            color: '#F5F0E8',
            border: '1px solid #C9A227',
          }}
        >
          {loading ? '저장 중...' : saved ? '저장됨' : '저장'}
        </button>
        <button
          type="button"
          onClick={handleHide}
          disabled={loading}
          className="w-full sm:w-auto px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          style={{ color: 'rgba(239,68,68,0.85)', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          배너 숨기기
        </button>
      </div>
    </form>
  )
}
