'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import type { MenuItem } from '@/types'
import { useDialog } from '@/hooks/useDialog'
import { useDialogs } from '@/components/providers/DialogProvider'
import { toClientPostImageUrl } from '@/lib/storage/postImagesClient'

const normalizeImageUrl = (raw?: string | null) => {
  if (!raw) return ''
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw
  return toClientPostImageUrl(raw) ?? raw
}

export default function EventEditModalButton({
  item,
  onUpdated,
  onDeleted,
}: {
  item: MenuItem
  onUpdated?: (item: MenuItem) => void
  onDeleted?: (id: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogs = useDialogs()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(item.name)
  const [content, setContent] = useState(item.description ?? '')
  const [imageUrl, setImageUrl] = useState(normalizeImageUrl(item.image_url))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [sortOrder, setSortOrder] = useState(String(item.sort_order))
  const [isAvailable, setIsAvailable] = useState(item.is_available)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const close = () => {
    setOpen(false)
    setError('')
    setLoading(false)
    setDeleting(false)
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
        id: item.id,
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
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '이벤트 수정에 실패했습니다.' }))
        if (uploadedImageUrl) {
          fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: uploadedImageUrl }) }).catch(() => {})
        }
        setError(data.error ?? '이벤트 수정에 실패했습니다.')
        setLoading(false)
        return
      }

      onUpdated?.({
        ...item,
        name: payload.name,
        description: payload.description,
        image_url: payload.image_url,
        sort_order: payload.sort_order,
        is_available: payload.is_available,
      })

      close()
    } catch (err) {
      if (uploadedImageUrl) {
        fetch('/api/upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: uploadedImageUrl }) }).catch(() => {})
      }
      setError(err instanceof Error ? err.message : '이벤트 수정에 실패했습니다.')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    const ok = await dialogs.confirm({ message: '이 이벤트를 삭제하시겠습니까?', variant: 'danger' })
    if (!ok) return
    setError('')
    setDeleting(true)

    const res = await fetch('/api/admin/menu-items', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '이벤트 삭제에 실패했습니다.' }))
      setError(data.error ?? '이벤트 삭제에 실패했습니다.')
      setDeleting(false)
      return
    }

    onDeleted?.(item.id)
    close()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1 rounded-md border"
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
            className="glass-modal w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto p-4 sm:p-6 md:p-7 bg-[#F5F0E8] dark:bg-[#1A1A0F]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id={titleId} className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                이벤트 수정
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
                    id={`event-edit-available-${item.id}`}
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                  />
                  <label htmlFor={`event-edit-available-${item.id}`} className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                    이벤트 페이지 노출
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ color: 'rgba(239,68,68,0.95)', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={loading || deleting}
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
