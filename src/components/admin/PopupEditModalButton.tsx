'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Popup } from '@/types'
import { useDialog } from '@/hooks/useDialog'
import { toClientPostImageUrl } from '@/lib/storage/postImagesClient'

export default function PopupEditModalButton({ popup }: { popup: Popup }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(popup.title)
  const [content, setContent] = useState(popup.content ?? '')
  const [imageUrl, setImageUrl] = useState(toClientPostImageUrl(popup.image_url) ?? popup.image_url ?? '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [isActive, setIsActive] = useState(popup.is_active)
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
      body: JSON.stringify({
        filename: imageFile.name,
        contentType: imageFile.type,
        fileSize: imageFile.size,
      }),
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

    try {
      const uploadedImageUrl = await uploadImage()
      const finalImageUrl = uploadedImageUrl || imageUrl || null

      const response = await fetch(`/api/admin/popups/${popup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content: content || null,
          image_url: finalImageUrl,
          is_active: isActive,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '팝업 수정에 실패했습니다.' }))
        setError(data.error ?? '팝업 수정에 실패했습니다.')
        setLoading(false)
        return
      }

      close()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '팝업 수정에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-md border shrink-0"
        style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
      >
        수정
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
            className="glass-card w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto p-4 sm:p-6 md:p-7"
            style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id={titleId} className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                팝업 수정
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
                  rows={6}
                  className="glass-input w-full px-3 py-2 text-sm resize-none"
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

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

                {(preview || imageUrl) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview || imageUrl}
                    alt="미리보기"
                    className="mt-2 w-24 h-24 rounded object-cover"
                    style={{ border: '1px solid rgba(201,162,39,0.3)' }}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`popup-active-${popup.id}`}
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <label
                  htmlFor={`popup-active-${popup.id}`}
                  className="text-sm"
                  style={{ color: 'var(--foreground)', opacity: 0.75 }}
                >
                  활성화
                </label>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={loading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
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
