'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toClientPostImageUrl } from '@/lib/storage/postImagesClient'

const DEFAULT_FALLBACK = '/reptile_image.png'

export default function MainBannerForm({
  initialImageUrl,
  initialRenderableUrl,
}: {
  initialImageUrl: string | null
  initialRenderableUrl: string | null
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [currentUrl, setCurrentUrl] = useState<string | null>(initialImageUrl)
  const [currentRenderable, setCurrentRenderable] = useState<string | null>(initialRenderableUrl)
  const [newFile, setNewFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (preview) URL.revokeObjectURL(preview)
    setNewFile(file)
    setPreview(file ? URL.createObjectURL(file) : '')
    setError('')
    setMessage('')
  }

  const uploadFile = async (file: File): Promise<string> => {
    const prepareRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size,
      }),
    })
    if (!prepareRes.ok) {
      const data = await prepareRes.json().catch(() => ({ error: '업로드 준비에 실패했습니다.' }))
      throw new Error(data.error ?? '업로드 준비에 실패했습니다.')
    }
    const { signedUrl, path } = (await prepareRes.json()) as { signedUrl?: string; path?: string }
    if (!signedUrl || !path) throw new Error('업로드 URL을 가져오지 못했습니다.')

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error('업로드에 실패했습니다.')
    return path
  }

  const patchHero = async (value: string | null) => {
    const res = await fetch('/api/admin/store-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero_image_url: value ?? '' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '저장에 실패했습니다.' }))
      throw new Error(data.error ?? '저장에 실패했습니다.')
    }
  }

  const handleSave = async () => {
    if (!newFile) {
      setError('새 이미지를 선택해주세요.')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const path = await uploadFile(newFile)
      await patchHero(path)
      setCurrentUrl(path)
      setCurrentRenderable(toClientPostImageUrl(path) ?? path)
      if (preview) URL.revokeObjectURL(preview)
      setPreview('')
      setNewFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setMessage('배너 이미지가 변경되었습니다.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!currentUrl) return
    if (!confirm('기본 배너 이미지로 되돌리시겠습니까? 현재 업로드된 이미지는 삭제됩니다.')) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      await patchHero(null)
      setCurrentUrl(null)
      setCurrentRenderable(null)
      setMessage('기본 배너로 되돌렸습니다.')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const displayUrl = preview || currentRenderable || DEFAULT_FALLBACK
  const showingFallback = !preview && !currentRenderable

  return (
    <div className="space-y-4">
      <div
        className="w-full aspect-[5/1] overflow-hidden border-y"
        style={{ borderColor: 'rgba(201, 162, 39, 0.25)', backgroundColor: '#1A1A0F' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayUrl}
          alt="메인 배너 미리보기"
          className="w-full h-full object-cover object-center"
        />
      </div>

      <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
        {preview
          ? '※ 저장 버튼을 눌러야 실제로 반영됩니다.'
          : showingFallback
            ? '현재 기본 배너 이미지(/reptile_image.png)를 사용 중입니다.'
            : '현재 업로드된 배너 이미지가 사용 중입니다.'}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg border"
          style={{ color: '#C9A227', borderColor: 'rgba(201, 162, 39, 0.4)' }}
        >
          이미지 선택
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !newFile}
          className="px-5 py-2 text-sm font-medium rounded-lg disabled:opacity-50"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          {loading ? '저장 중...' : '이 이미지로 저장'}
        </button>

        {currentUrl && (
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border"
            style={{ color: 'rgba(239,68,68,0.9)', borderColor: 'rgba(239,68,68,0.35)' }}
          >
            기본 이미지로 되돌리기
          </button>
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
        권장 비율: 5:1 (예: 1920×384). 너무 큰 파일은 업로드 오류가 날 수 있습니다(최대 8MB).
      </p>

      {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
      {message && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#9acd6a', backgroundColor: 'rgba(69,97,50,0.2)' }}>
          {message}
        </p>
      )}
    </div>
  )
}
