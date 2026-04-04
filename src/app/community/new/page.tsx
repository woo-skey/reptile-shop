'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function NewPostPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 4)
    setImages(files)
    setPreviews(files.map((f) => URL.createObjectURL(f)))
  }

  const uploadImages = async (): Promise<string[]> => {
    const paths: string[] = []
    for (const file of images) {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      })
      const { signedUrl, path } = await res.json()
      await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      paths.push(path)
    }
    return paths
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

    try {
      const imagePaths = images.length > 0 ? await uploadImages() : []

      const supabase = createClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('프로필을 찾을 수 없습니다.')

      const { error: insertError } = await supabase.from('posts').insert({
        author_id: user.id,
        type: 'community',
        title,
        content,
        image_urls: imagePaths,
      })

      if (insertError) throw insertError

      router.push('/community')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '게시글 작성에 실패했습니다.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
      >
        글쓰기
      </h1>

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
            placeholder="제목을 입력하세요"
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
            placeholder="내용을 입력하세요"
            rows={8}
            className="glass-input w-full px-4 py-3 text-sm resize-none"
            style={{ color: 'var(--foreground)' }}
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
            사진 첨부 <span style={{ color: 'var(--foreground)', opacity: 0.4 }}>(최대 4장)</span>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 text-sm rounded-lg border transition-colors"
            style={{ color: '#C9A227', borderColor: 'rgba(201, 162, 39, 0.4)' }}
          >
            사진 선택
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageChange}
          />

          {previews.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {previews.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`미리보기 ${i + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                  style={{ border: '1px solid rgba(201, 162, 39, 0.3)' }}
                />
              ))}
            </div>
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
            {loading ? '게시 중...' : '게시하기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
