'use client'

import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const toPublicImageUrl = (path: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return path
  return `${baseUrl}/storage/v1/object/public/post-images/${path}`
}

export default function NewPopupPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      body: JSON.stringify({ filename: imageFile.name, contentType: imageFile.type }),
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

    return toPublicImageUrl(path as string)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const uploadedImageUrl = await uploadImage()
      const finalImageUrl = uploadedImageUrl || imageUrl || null

      const supabase = createClient()
      const { error: insertError } = await supabase.from('popups').insert({
        title,
        content: content || null,
        image_url: finalImageUrl,
        is_active: isActive,
      })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.push('/admin/popup')
    } catch (err) {
      setError(err instanceof Error ? err.message : '팝업 생성에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
        팝업 생성
      </h2>

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
            placeholder="팝업 제목을 입력하세요"
            className="glass-input w-full px-4 py-2.5 text-sm"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            내용
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="팝업 내용을 입력하세요"
            rows={8}
            className="glass-input w-full px-4 py-3 text-sm resize-none"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            이미지 URL
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
            className="glass-input w-full px-4 py-2.5 text-sm"
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

        <div className="flex items-center gap-2">
          <input
            id="popup-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="popup-active" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
            즉시 활성화
          </label>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
          >
            {loading ? '생성 중...' : '팝업 생성'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm"
            style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
