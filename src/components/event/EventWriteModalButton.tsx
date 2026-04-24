'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/types'
import { useDialog } from '@/hooks/useDialog'
import { toClientPostImageUrl } from '@/lib/storage/postImagesClient'

export default function EventWriteModalButton({
  onCreated,
}: {
  onCreated?: (item: MenuItem) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [isAvailable, setIsAvailable] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setOpen(false)
    setError('')
    setLoading(false)
  }

  const { dialogRef, titleId } = useDialog({
    isOpen: open,
    onClose: close,
    initialFocusRef: closeButtonRef,
  })

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (preview) URL.revokeObjectURL(preview)
    const file = e.target.files?.[0]
    setImageFile(file ?? null)
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  const uploadImage = async () => {
    if (!imageFile) return null

    const prepareRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: imageFile.name, contentType: imageFile.type, fileSize: imageFile.size }),
    })

    if (!prepareRes.ok) {
      const data = await prepareRes.json().catch(() => ({ error: '이미지 업로드 준비에 실패했습니다.' }))
      throw new Error(data.error ?? '이미지 업로드 준비에 실패했습니다.')
    }

    const { signedUrl, path } = await prepareRes.json()

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.type },
      body: imageFile,
    })

    if (!uploadRes.ok) {
      throw new Error('이미지 업로드에 실패했습니다.')
    }

    return toClientPostImageUrl(path as string)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let uploadedImageUrl: string | null = null
    try {
      uploadedImageUrl = await uploadImage()
      const payload = {
        category: 'event_post',
        name: title,
        description: content || null,
        sort_order: Number.parseInt(sortOrder, 10) || 0,
        is_available: isAvailable,
        subcategory: null,
        note: null,
        abv: null,
        volume_ml: null,
        price: null,
        price_glass: null,
        price_bottle: null,
        image_url: uploadedImageUrl || imageUrl || null,
      }

      const res = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '이벤트 등록에 실패했습니다.' }))
        if (uploadedImageUrl) {
          fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: uploadedImageUrl }) }).catch(() => {})
        }
        setError(data.error ?? '이벤트 등록에 실패했습니다.')
        setLoading(false)
        return
      }

      const data = await res.json().catch(() => null)
      if (data?.item) {
        onCreated?.(data.item as MenuItem)
      }

      close()
      setTitle('')
      setContent('')
      setImageUrl('')
      setImageFile(null)
      setPreview('')
      if (fileRef.current) fileRef.current.value = ''
      setSortOrder('0')
      setIsAvailable(true)
    } catch (err) {
      if (uploadedImageUrl) {
        fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: uploadedImageUrl }) }).catch(() => {})
      }
      setError(err instanceof Error ? err.message : '이벤트 등록에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
      >
        이벤트 작성
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-6 overflow-y-auto"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="glass-modal w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto p-4 sm:p-6 md:p-7 bg-[#F5F0E8] dark:bg-[#1A1A0F]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id={titleId} className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                이벤트 작성
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className="text-xs px-2 py-1 rounded border"
                style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                  이미지
                </label>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-3 py-1.5 text-xs rounded-md border"
                    style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
                  >
                    파일 선택
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                    또는 이미지 URL 입력
                  </span>
                </div>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: 'var(--foreground)' }}
                />
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="미리보기"
                    className="mt-2 w-24 h-24 rounded object-cover"
                    style={{ border: '1px solid rgba(201,162,39,0.3)' }}
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                  제목 *
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-input w-full px-3 py-2 text-sm"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                  내용
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="glass-input w-full px-3 py-2 text-sm resize-none"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-60" style={{ color: 'var(--foreground)' }}>
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="glass-input w-full px-3 py-2 text-sm"
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="event-create-available"
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <label htmlFor="event-create-available" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                    이벤트 페이지 노출
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? '등록 중...' : '등록하기'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm"
                  style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
