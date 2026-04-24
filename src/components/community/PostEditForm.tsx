'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type ExistingImage = { path: string; url: string }
type NewImage = { file: File; previewUrl: string; localId: string }

const MAX_IMAGES = 4

export default function PostEditForm({
  postId,
  initialTitle,
  initialContent,
  initialImages,
}: {
  postId: string
  initialTitle: string
  initialContent: string
  initialImages: ExistingImage[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [keptImages, setKeptImages] = useState<ExistingImage[]>(initialImages)
  const [newImages, setNewImages] = useState<NewImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      newImages.forEach((img) => URL.revokeObjectURL(img.previewUrl))
    }
  }, [newImages])

  const totalCount = keptImages.length + newImages.length

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const allowed = Math.max(0, MAX_IMAGES - totalCount)
    const slice = files.slice(0, allowed)
    const additions: NewImage[] = slice.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      localId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }))
    setNewImages((prev) => [...prev, ...additions])
    if (fileRef.current) fileRef.current.value = ''
  }

  const removeExisting = (path: string) => {
    setKeptImages((prev) => prev.filter((img) => img.path !== path))
  }

  const removeNew = (localId: string) => {
    setNewImages((prev) => {
      const target = prev.find((img) => img.localId === localId)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((img) => img.localId !== localId)
    })
  }

  const uploadSingle = async (file: File): Promise<string> => {
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
      const data = await prepareRes.json().catch(() => ({ error: '이미지 업로드 준비에 실패했습니다.' }))
      throw new Error(data.error ?? '이미지 업로드 준비에 실패했습니다.')
    }

    const { signedUrl, path } = (await prepareRes.json()) as { signedUrl?: string; path?: string }
    if (!signedUrl || !path) throw new Error('이미지 업로드 URL을 가져오지 못했습니다.')

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error('이미지 업로드에 실패했습니다.')
    return path
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)

    let uploadedPaths: string[] = []
    try {
      uploadedPaths = newImages.length > 0
        ? await Promise.all(newImages.map((img) => uploadSingle(img.file)))
        : []

      const nextImageUrls = [...keptImages.map((img) => img.path), ...uploadedPaths]

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          image_urls: nextImageUrls,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '게시글 수정에 실패했습니다.' }))
        setError(data.error ?? '게시글 수정에 실패했습니다.')
        if (uploadedPaths.length > 0) {
          await Promise.all(uploadedPaths.map(p =>
            fetch('/api/upload', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: p }),
            }).catch(() => {})
          ))
        }
        setLoading(false)
        return
      }

      router.push(`/community/${postId}`)
      router.refresh()
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await Promise.all(uploadedPaths.map(p =>
          fetch('/api/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: p }),
          }).catch(() => {})
        ))
      }
      setError(err instanceof Error ? err.message : '네트워크 오류로 게시글 수정에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          제목
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          내용
        </label>
        <textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className="glass-input w-full px-4 py-3 text-sm resize-none"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          사진 <span style={{ color: 'var(--foreground)', opacity: 0.4 }}>({totalCount}/{MAX_IMAGES})</span>
        </label>

        {totalCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {keptImages.map((img) => (
              <div key={img.path} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt="기존 이미지"
                  className="w-20 h-20 object-cover rounded-lg"
                  style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}
                />
                <button
                  type="button"
                  onClick={() => removeExisting(img.path)}
                  aria-label="이미지 삭제"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 text-xs font-bold rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: '#F5F0E8' }}
                >
                  ×
                </button>
              </div>
            ))}
            {newImages.map((img) => (
              <div key={img.localId} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt="새 이미지"
                  className="w-20 h-20 object-cover rounded-lg"
                  style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}
                />
                <span
                  className="absolute bottom-0 left-0 right-0 text-[10px] text-center py-0.5"
                  style={{ backgroundColor: 'rgba(69,97,50,0.85)', color: '#F5D76E' }}
                >
                  NEW
                </span>
                <button
                  type="button"
                  onClick={() => removeNew(img.localId)}
                  aria-label="이미지 삭제"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 text-xs font-bold rounded-full"
                  style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: '#F5F0E8' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {totalCount < MAX_IMAGES && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-4 py-2 text-sm rounded-lg border"
              style={{ color: '#C9A227', borderColor: 'rgba(201, 162, 39, 0.4)' }}
            >
              사진 추가
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleAddImages}
            />
          </>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          {loading ? '수정 중...' : '수정 저장'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/community/${postId}`)}
          className="px-6 py-2.5 rounded-lg text-sm transition-all"
          style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
        >
          취소
        </button>
      </div>
    </form>
  )
}
