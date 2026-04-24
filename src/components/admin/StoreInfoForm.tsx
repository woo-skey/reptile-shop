'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { StoreInfo } from '@/types'

type FormState = {
  address: string
  phone: string
  business_hours: string
  closed_days: string
  instagram_url: string
  kakao_url: string
  map_url: string
  extra_note: string
}

const toInitial = (info: StoreInfo | null): FormState => ({
  address: info?.address ?? '',
  phone: info?.phone ?? '',
  business_hours: info?.business_hours ?? '',
  closed_days: info?.closed_days ?? '',
  instagram_url: info?.instagram_url ?? '',
  kakao_url: info?.kakao_url ?? '',
  map_url: info?.map_url ?? '',
  extra_note: info?.extra_note ?? '',
})

export default function StoreInfoForm({ initialInfo }: { initialInfo: StoreInfo | null }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(toInitial(initialInfo))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('/api/admin/store-info', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: '저장에 실패했습니다.' }))
        setError(data.error ?? '저장에 실패했습니다.')
        setLoading(false)
        return
      }

      setMessage('저장되었습니다.')
      setLoading(false)
      router.refresh()
    } catch {
      setError('네트워크 오류로 저장에 실패했습니다.')
      setLoading(false)
    }
  }

  const inputCls = 'glass-input w-full px-3 py-2 text-sm'
  const labelCls = 'block text-xs font-medium mb-1 opacity-60'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls} style={{ color: 'var(--foreground)' }}>주소</label>
        <input
          type="text"
          value={form.address}
          onChange={set('address')}
          placeholder="서울특별시 ..."
          className={inputCls}
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>연락처</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="02-0000-0000"
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>휴무일</label>
          <input
            type="text"
            value={form.closed_days}
            onChange={set('closed_days')}
            placeholder="예: 매주 월요일 휴무"
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} style={{ color: 'var(--foreground)' }}>영업시간</label>
        <textarea
          value={form.business_hours}
          onChange={set('business_hours')}
          placeholder="평일 18:00 ~ 02:00&#10;주말 17:00 ~ 02:00"
          rows={3}
          className={`${inputCls} resize-none`}
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>Instagram URL</label>
          <input
            type="url"
            value={form.instagram_url}
            onChange={set('instagram_url')}
            placeholder="https://instagram.com/..."
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>카카오톡 채널 URL</label>
          <input
            type="url"
            value={form.kakao_url}
            onChange={set('kakao_url')}
            placeholder="https://pf.kakao.com/..."
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
        <div>
          <label className={labelCls} style={{ color: 'var(--foreground)' }}>지도 URL</label>
          <input
            type="url"
            value={form.map_url}
            onChange={set('map_url')}
            placeholder="https://map.naver.com/... 또는 kakao.com"
            className={inputCls}
            style={{ color: 'var(--foreground)' }}
          />
        </div>
      </div>

      <div>
        <label className={labelCls} style={{ color: 'var(--foreground)' }}>추가 안내</label>
        <textarea
          value={form.extra_note}
          onChange={set('extra_note')}
          placeholder="주차 안내, 예약 안내 등"
          rows={2}
          className={`${inputCls} resize-none`}
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
      {message && <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#9acd6a', backgroundColor: 'rgba(69,97,50,0.2)' }}>{message}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-all"
          style={{ backgroundColor: '#456132', color: '#F5F0E8', border: '1px solid #C9A227' }}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  )
}
