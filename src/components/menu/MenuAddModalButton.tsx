'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { MenuCategory } from '@/types'

const WINE_SUBS = ['red', 'white', 'sparkling']
const WHISKY_SUBS = ['single_malt', 'blended', 'bourbon', 'tennessee']

const CATEGORY_LABEL: Record<MenuCategory, string> = {
  event: '이벤트',
  food: '메뉴',
  signature: '메뉴',
  cocktail: '메뉴',
  beer: '메뉴',
  wine: '메뉴',
  whisky: '메뉴',
  shochu: '메뉴',
  spirits: '메뉴',
}

export default function MenuAddModalButton({ category }: { category: MenuCategory }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    subcategory: '',
    name: '',
    description: '',
    note: '',
    abv: '',
    volume_ml: '',
    price: '',
    price_glass: '',
    price_bottle: '',
    sort_order: '0',
    is_available: true,
    image_url: '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const set = (k: string, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }))

  const needsSub = category === 'wine' || category === 'whisky' || category === 'cocktail'
  const needsNote = category === 'food'
  const needsAbv = !['food', 'event'].includes(category)
  const needsVol = category === 'beer'
  const needsGlass = ['wine', 'whisky', 'shochu', 'spirits'].includes(category)
  const needsPrice = !needsGlass
  const subOptions = category === 'wine' ? WINE_SUBS : category === 'whisky' ? WHISKY_SUBS : []

  const reset = () => {
    setForm({
      subcategory: '',
      name: '',
      description: '',
      note: '',
      abv: '',
      volume_ml: '',
      price: '',
      price_glass: '',
      price_bottle: '',
      sort_order: '0',
      is_available: true,
      image_url: '',
    })
    setImageFile(null)
    setPreview('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const close = () => {
    setOpen(false)
    setError('')
    setLoading(false)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setImageFile(file ?? null)
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: imageFile.name, contentType: imageFile.type }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '사진 업로드 준비에 실패했습니다.' }))
      throw new Error(data.error ?? '사진 업로드 준비에 실패했습니다.')
    }

    const { signedUrl, path } = await res.json()

    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.type },
      body: imageFile,
    })

    if (!uploadRes.ok) {
      throw new Error('사진 업로드에 실패했습니다.')
    }

    return path as string
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const uploadedPath = await uploadImage()
      const imageUrl = uploadedPath || form.image_url || null

      const res = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subcategory: form.subcategory || null,
          name: form.name,
          description: form.description || null,
          note: form.note || null,
          abv: form.abv ? parseFloat(form.abv) : null,
          volume_ml: form.volume_ml ? parseInt(form.volume_ml) : null,
          price: form.price ? parseInt(form.price) : null,
          price_glass: form.price_glass ? parseInt(form.price_glass) : null,
          price_bottle: form.price_bottle ? parseInt(form.price_bottle) : null,
          sort_order: parseInt(form.sort_order) || 0,
          is_available: form.is_available,
          image_url: imageUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '등록에 실패했습니다.' }))
        setError(data.error ?? '등록에 실패했습니다.')
        setLoading(false)
        return
      }

      reset()
      close()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.')
      setLoading(false)
    }
  }

  const inputCls = 'glass-input w-full px-3 py-2 text-sm'
  const labelCls = 'block text-xs font-medium mb-1 opacity-60'
  const addLabel = category === 'event' ? '이벤트 추가' : '메뉴 추가'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg"
        style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
      >
        {addLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
          onClick={close}
        >
          <div
            className="glass-card w-full max-w-xl p-6 md:p-7"
            style={{ border: '1px solid rgba(201, 162, 39, 0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                {CATEGORY_LABEL[category]} 등록
              </h3>
              <button
                onClick={close}
                className="text-xs px-2 py-1 rounded border"
                style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                닫기
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                  사진
                </label>
                <div className="flex items-center gap-2 mb-2">
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
                  value={form.image_url}
                  onChange={(e) => set('image_url', e.target.value)}
                  placeholder="https://..."
                  className={inputCls}
                  style={{ color: 'var(--foreground)' }}
                />
                {preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="미리보기"
                    className="mt-2 w-20 h-20 object-cover rounded"
                    style={{ border: '1px solid rgba(201,162,39,0.3)' }}
                  />
                )}
              </div>

              {needsSub && (
                <div>
                  <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                    {category === 'cocktail' ? '가격 티어 (예: 12000)' : '서브 카테고리'}
                  </label>
                  {subOptions.length > 0 ? (
                    <select
                      value={form.subcategory}
                      onChange={(e) => set('subcategory', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    >
                      <option value="">선택</option>
                      {subOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={form.subcategory}
                      onChange={(e) => set('subcategory', e.target.value)}
                      placeholder="예: 12000"
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  )}
                </div>
              )}

              <div>
                <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                  이름 *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  className={inputCls}
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              <div>
                <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                  설명
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  rows={2}
                  className={`${inputCls} resize-none`}
                  style={{ color: 'var(--foreground)' }}
                />
              </div>

              {needsNote && (
                <div>
                  <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                    비고
                  </label>
                  <input
                    type="text"
                    value={form.note}
                    onChange={(e) => set('note', e.target.value)}
                    className={inputCls}
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {needsAbv && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      도수 (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={form.abv}
                      onChange={(e) => set('abv', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                {needsVol && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      용량 (ml)
                    </label>
                    <input
                      type="number"
                      value={form.volume_ml}
                      onChange={(e) => set('volume_ml', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                {needsPrice && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      가격 (원)
                    </label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                {needsGlass && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      1 Glass (원)
                    </label>
                    <input
                      type="number"
                      value={form.price_glass}
                      onChange={(e) => set('price_glass', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                {needsGlass && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      1 Bottle (원)
                    </label>
                    <input
                      type="number"
                      value={form.price_bottle}
                      onChange={(e) => set('price_bottle', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                  </div>
                )}

                <div>
                  <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                    정렬 순서
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => set('sort_order', e.target.value)}
                    className={inputCls}
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="modal-avail"
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => set('is_available', e.target.checked)}
                />
                <label htmlFor="modal-avail" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                  메뉴에 노출
                </label>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? '등록 중...' : '등록하기'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="px-5 py-2.5 rounded-lg text-sm"
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
