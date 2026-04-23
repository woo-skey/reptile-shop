'use client'

import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import type { MenuCategory, MenuItem } from '@/types'
import { useDialog } from '@/hooks/useDialog'
import { toClientPostImageUrl } from '@/lib/storage/postImagesClient'

const CATEGORIES: { value: MenuCategory; label: string }[] = [
  { value: 'event', label: 'Event / New' },
  { value: 'food', label: 'Food' },
  { value: 'signature', label: 'Signature' },
  { value: 'cocktail', label: 'Cocktail' },
  { value: 'beer', label: 'Beer' },
  { value: 'wine', label: 'Wine' },
  { value: 'whisky', label: 'Whisky' },
  { value: 'shochu', label: 'Shochu' },
  { value: 'spirits', label: 'Spirits' },
  { value: 'non_alcohol', label: 'Non-Alcohol' },
  { value: 'beverage', label: 'Beverage' },
]

const WINE_SUBS = ['red', 'white', 'sparkling']
const WHISKY_SUBS = ['single_malt', 'blended', 'bourbon', 'tennessee']

const toNumberOrNull = (value: string, parser: (input: string) => number) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parser(trimmed)
  return Number.isNaN(parsed) ? null : parsed
}

export default function MenuEditModalButton({
  item,
  onUpdated,
  onDeleted,
}: {
  item: MenuItem
  onUpdated: (updated: MenuItem) => void
  onDeleted?: (deletedId: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    category: item.category,
    subcategory: item.subcategory ?? '',
    name: item.name,
    description: item.description ?? '',
    note: item.note ?? '',
    abv: item.abv != null ? String(item.abv) : '',
    volume_ml: item.volume_ml != null ? String(item.volume_ml) : '',
    price: item.price != null ? String(item.price) : '',
    price_glass: item.price_glass != null ? String(item.price_glass) : '',
    price_bottle: item.price_bottle != null ? String(item.price_bottle) : '',
    sort_order: String(item.sort_order),
    popular_order: item.popular_order != null ? String(item.popular_order) : '',
    is_available: item.is_available,
    image_url: toClientPostImageUrl(item.image_url) ?? item.image_url ?? '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const set = (k: string, v: string | boolean) => setForm((prev) => ({ ...prev, [k]: v }))

  const currentCategory = form.category
  const supportsImage = currentCategory === 'event' || currentCategory === 'food'
  const needsSub = currentCategory === 'wine' || currentCategory === 'whisky' || currentCategory === 'cocktail'
  const needsNote = currentCategory === 'food'
  const needsAbv = !['food', 'event', 'non_alcohol', 'beverage'].includes(currentCategory)
  const needsVol = currentCategory === 'beer'
  const needsGlass = ['wine', 'whisky', 'shochu', 'spirits'].includes(currentCategory)
  const needsPrice = !needsGlass && currentCategory !== 'cocktail' && currentCategory !== 'event'
  const supportsPopular = currentCategory !== 'event' && currentCategory !== 'event_post'
  const subOptions = currentCategory === 'wine' ? WINE_SUBS : currentCategory === 'whisky' ? WHISKY_SUBS : []

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

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (preview) URL.revokeObjectURL(preview)
    const file = e.target.files?.[0]
    setImageFile(file ?? null)
    setPreview(file ? URL.createObjectURL(file) : '')
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: imageFile.name, contentType: imageFile.type, fileSize: imageFile.size }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Image upload 준비에 실패했습니다.' }))
      throw new Error(data.error ?? 'Image upload 준비에 실패했습니다.')
    }

    const { signedUrl, path } = await res.json()
    const uploadRes = await fetch(signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': imageFile.type },
      body: imageFile,
    })

    if (!uploadRes.ok) {
      throw new Error('Image upload에 실패했습니다.')
    }

    return toClientPostImageUrl(path as string)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const uploadedPath = supportsImage ? await uploadImage() : null
      const imageUrl = supportsImage
        ? (uploadedPath || toClientPostImageUrl(form.image_url) || form.image_url || null)
        : null

      const payload = {
        id: item.id,
        category: form.category,
        subcategory: form.subcategory || null,
        name: form.name,
        description: form.description || null,
        note: form.note || null,
        abv: toNumberOrNull(form.abv, parseFloat),
        volume_ml: toNumberOrNull(form.volume_ml, parseInt),
        price: currentCategory === 'cocktail' || currentCategory === 'event' ? null : toNumberOrNull(form.price, parseInt),
        price_glass: toNumberOrNull(form.price_glass, parseInt),
        price_bottle: toNumberOrNull(form.price_bottle, parseInt),
        sort_order: toNumberOrNull(form.sort_order, parseInt) ?? 0,
        popular_order: supportsPopular ? toNumberOrNull(form.popular_order, parseInt) : null,
        is_available: form.is_available,
        image_url: imageUrl,
      }

      const res = await fetch('/api/admin/menu-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Update failed.' }))
        setError(data.error ?? 'Update failed.')
        setLoading(false)
        return
      }

      onUpdated({
        ...item,
        category: payload.category,
        subcategory: payload.subcategory,
        name: payload.name,
        description: payload.description,
        note: payload.note,
        abv: payload.abv,
        volume_ml: payload.volume_ml,
        price: payload.price,
        price_glass: payload.price_glass,
        price_bottle: payload.price_bottle,
        sort_order: payload.sort_order,
        popular_order: payload.popular_order,
        is_available: payload.is_available,
        image_url: payload.image_url,
      })

      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this menu item?')) return

    setError('')
    setDeleting(true)

    try {
      const res = await fetch('/api/admin/menu-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Delete failed.' }))
        setError(data.error ?? 'Delete failed.')
        setDeleting(false)
        return
      }

      onDeleted?.(item.id)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
    }
  }

  const inputCls = 'glass-input w-full px-3 py-2 text-sm'
  const labelCls = 'block text-xs font-medium mb-1 opacity-60'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs px-2.5 py-1 rounded-md border"
        style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
      >
        Edit
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
            className="glass-modal w-full max-w-xl max-h-[calc(100vh-3rem)] overflow-y-auto p-4 sm:p-6 md:p-7"
            style={{ backgroundColor: 'var(--background)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 id={titleId} className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
                Edit Menu
              </h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                className="text-xs px-2 py-1 rounded border"
                style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(255,255,255,0.2)' }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  className={inputCls}
                  style={{ color: 'var(--foreground)' }}
                >
                  {CATEGORIES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {supportsImage && (
                <div>
                  <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                    Image
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="px-3 py-1.5 text-xs rounded-md border"
                      style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
                    >
                      Choose file
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                      or image URL
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
                  {(preview || form.image_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview || form.image_url}
                      alt="preview"
                      className="mt-2 w-20 h-20 object-cover rounded"
                      style={{ border: '1px solid rgba(201,162,39,0.3)' }}
                    />
                  )}
                </div>
              )}

              {needsSub && (
                <div>
                  <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                    {currentCategory === 'cocktail' ? '가격 (예: 12000)' : 'Subcategory'}
                  </label>
                  {subOptions.length > 0 ? (
                    <select
                      value={form.subcategory}
                      onChange={(e) => set('subcategory', e.target.value)}
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    >
                      <option value="">Select</option>
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
                  Name *
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
                  Description
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
                    Note
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {needsAbv && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      ABV (%)
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
                      Volume (ml)
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
                      Price (KRW)
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
                      1 Glass (KRW)
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
                      1 Bottle (KRW)
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
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => set('sort_order', e.target.value)}
                    className={inputCls}
                    style={{ color: 'var(--foreground)' }}
                  />
                </div>

                {supportsPopular && (
                  <div>
                    <label className={labelCls} style={{ color: 'var(--foreground)' }}>
                      인기메뉴 순서
                    </label>
                    <input
                      type="number"
                      value={form.popular_order}
                      onChange={(e) => set('popular_order', e.target.value)}
                      placeholder="비우면 인기메뉴 제외"
                      className={inputCls}
                      style={{ color: 'var(--foreground)' }}
                    />
                    <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                      숫자가 작을수록 먼저 노출. 홈 인기메뉴 섹션에 최대 3개까지 표시됩니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`modal-avail-${item.id}`}
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => set('is_available', e.target.checked)}
                />
                <label htmlFor={`modal-avail-${item.id}`} className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                  Visible
                </label>
              </div>

              {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ color: 'rgba(239,68,68,0.95)', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  disabled={loading || deleting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm disabled:opacity-50"
                  style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
