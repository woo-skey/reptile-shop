'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const CATEGORIES = [
  { value: 'event',     label: 'Event / New' },
  { value: 'food',      label: 'Food' },
  { value: 'signature', label: 'Signature' },
  { value: 'cocktail',  label: 'Cocktail' },
  { value: 'beer',      label: 'Beer' },
  { value: 'wine',      label: 'Wine' },
  { value: 'whisky',    label: 'Whisky' },
  { value: 'shochu',    label: 'Shochu' },
  { value: 'spirits',   label: 'Spirits' },
]

const WINE_SUBS   = ['red', 'white', 'sparkling']
const WHISKY_SUBS = ['single_malt', 'blended', 'bourbon', 'tennessee']

export default function NewMenuItemPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [category, setCategory] = useState('food')
  const [form, setForm] = useState({
    subcategory: '', name: '', description: '', note: '',
    abv: '', volume_ml: '', price: '', price_glass: '', price_bottle: '',
    sort_order: '0', is_available: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  const needsSub    = category === 'wine' || category === 'whisky' || category === 'cocktail'
  const needsNote   = category === 'food'
  const needsAbv    = !['food', 'event'].includes(category)
  const needsVol    = category === 'beer'
  const needsGlass  = ['wine', 'whisky', 'shochu', 'spirits'].includes(category)
  const needsPrice  = !needsGlass

  const subOptions =
    category === 'wine' ? WINE_SUBS :
    category === 'whisky' ? WHISKY_SUBS : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setLoading(true)

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
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: '메뉴 저장에 실패했습니다.' }))
      setError(data.error ?? '메뉴 저장에 실패했습니다.')
      setLoading(false)
      return
    }

    router.push('/admin/menu')
    router.refresh()
  }

  const inputCls = 'glass-input w-full px-3 py-2 text-sm'
  const labelCls = 'block text-xs font-medium mb-1 opacity-60'

  return (
    <div className="max-w-lg">
      <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--foreground)' }}>
        메뉴 아이템 추가
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 카테고리 */}
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>카테고리</label>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); set('subcategory', '') }}
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          >
            {CATEGORIES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* 서브카테고리 */}
        {needsSub && (
          <div>
            <label className={labelCls} style={{ color: 'var(--foreground)' }}>
              {category === 'cocktail' ? '가격 티어 (숫자만, 예: 12000)' : '서브카테고리'}
            </label>
            {subOptions.length > 0 ? (
              <select
                value={form.subcategory}
                onChange={(e) => set('subcategory', e.target.value)}
                className={inputCls}
                style={{ color: 'var(--foreground)' }}
              >
                <option value="">선택</option>
                {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
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

        {/* 이름 */}
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>메뉴 이름 *</label>
          <input required type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
            className={inputCls} style={{ color: 'var(--foreground)' }} />
        </div>

        {/* 설명 */}
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>설명</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            rows={2} className={`${inputCls} resize-none`} style={{ color: 'var(--foreground)' }} />
        </div>

        {/* 비고 (food) */}
        {needsNote && (
          <div>
            <label className={labelCls} style={{ color: 'var(--foreground)' }}>비고</label>
            <input type="text" value={form.note} onChange={(e) => set('note', e.target.value)}
              className={inputCls} style={{ color: 'var(--foreground)' }} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* 도수 */}
          {needsAbv && (
            <div>
              <label className={labelCls} style={{ color: 'var(--foreground)' }}>도수 (%)</label>
              <input type="number" step="0.1" value={form.abv} onChange={(e) => set('abv', e.target.value)}
                className={inputCls} style={{ color: 'var(--foreground)' }} />
            </div>
          )}

          {/* 용량 (beer) */}
          {needsVol && (
            <div>
              <label className={labelCls} style={{ color: 'var(--foreground)' }}>용량 (ml)</label>
              <input type="number" value={form.volume_ml} onChange={(e) => set('volume_ml', e.target.value)}
                className={inputCls} style={{ color: 'var(--foreground)' }} />
            </div>
          )}

          {/* 단일 가격 */}
          {needsPrice && (
            <div>
              <label className={labelCls} style={{ color: 'var(--foreground)' }}>가격 (원)</label>
              <input type="number" value={form.price} onChange={(e) => set('price', e.target.value)}
                className={inputCls} style={{ color: 'var(--foreground)' }} />
            </div>
          )}

          {/* 1 Glass */}
          {needsGlass && (
            <div>
              <label className={labelCls} style={{ color: 'var(--foreground)' }}>1 Glass (원)</label>
              <input type="number" value={form.price_glass} onChange={(e) => set('price_glass', e.target.value)}
                className={inputCls} style={{ color: 'var(--foreground)' }} />
            </div>
          )}

          {/* 1 Bottle */}
          {needsGlass && (
            <div>
              <label className={labelCls} style={{ color: 'var(--foreground)' }}>1 Bottle (원)</label>
              <input type="number" value={form.price_bottle} onChange={(e) => set('price_bottle', e.target.value)}
                className={inputCls} style={{ color: 'var(--foreground)' }} />
            </div>
          )}

          {/* 정렬 순서 */}
          <div>
            <label className={labelCls} style={{ color: 'var(--foreground)' }}>정렬 순서</label>
            <input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)}
              className={inputCls} style={{ color: 'var(--foreground)' }} />
          </div>
        </div>

        {/* 품절 여부 */}
        <div className="flex items-center gap-2">
          <input id="avail" type="checkbox" checked={form.is_available}
            onChange={(e) => set('is_available', e.target.checked)} />
          <label htmlFor="avail" className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
            판매 중 (체크 해제 시 메뉴에서 숨김)
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}>
            {loading ? '추가 중...' : '추가하기'}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg text-sm"
            style={{ color: 'var(--foreground)', opacity: 0.6, border: '1px solid rgba(255,255,255,0.15)' }}>
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
