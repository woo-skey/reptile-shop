'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDialog } from '@/hooks/useDialog'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { MenuCategory, MenuItem } from '@/types'

type PriceOption = { suffix: string; price: number }
type LineItem = {
  key: string
  name: string
  suffix: string
  unitPrice: number
  quantity: number
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food',
  non_alcohol: 'Non-Alcohol',
  beverage: 'Beverage',
  signature: 'Signature',
  cocktail: 'Cocktail',
  beer: 'Beer',
  wine: 'Wine',
  whisky: 'Whisky',
  shochu: 'Shochu',
  spirits: 'Spirits',
}

const CATEGORY_ORDER: MenuCategory[] = [
  'food',
  'non_alcohol',
  'beverage',
  'signature',
  'cocktail',
  'beer',
  'wine',
  'whisky',
  'shochu',
  'spirits',
]

const getPriceOptions = (item: MenuItem): PriceOption[] => {
  if (item.category === 'cocktail') {
    const parsed = item.subcategory ? parseInt(item.subcategory, 10) : NaN
    if (Number.isFinite(parsed)) return [{ suffix: '', price: parsed }]
    return []
  }
  if (item.price != null) return [{ suffix: '', price: item.price }]
  const options: PriceOption[] = []
  if (item.price_glass != null) options.push({ suffix: 'Glass', price: item.price_glass })
  if (item.price_bottle != null) options.push({ suffix: 'Bottle', price: item.price_bottle })
  return options
}

type PrefillLine = {
  name: string
  suffix: string
  unitPrice: number
  quantity: number
}

export default function MenuCalculatorModal({
  items,
  isOpen,
  onClose,
  prefillLines,
}: {
  items: MenuItem[]
  isOpen: boolean
  onClose: () => void
  prefillLines?: PrefillLine[]
}) {
  const { user } = useAuth()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [lines, setLines] = useState<LineItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<MenuCategory>('food')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')

  useEffect(() => {
    if (!isOpen) return
    if (!prefillLines || prefillLines.length === 0) return
    setLines(
      prefillLines.map((l, idx) => ({
        key: `prefill-${idx}-${l.name}-${l.suffix}`,
        name: l.name,
        suffix: l.suffix,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      }))
    )
  }, [isOpen, prefillLines])

  const availableCategories = useMemo(() => {
    const set = new Set<MenuCategory>()
    for (const item of items) {
      if (item.category === 'event' || item.category === 'event_post') continue
      if (getPriceOptions(item).length === 0) continue
      set.add(item.category)
    }
    return CATEGORY_ORDER.filter((cat) => set.has(cat))
  }, [items])
  const activeCategory = availableCategories.includes(category)
    ? category
    : (availableCategories[0] ?? 'food')

  const { dialogRef, titleId } = useDialog({
    isOpen,
    onClose,
    initialFocusRef: closeButtonRef,
  })

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (item.category !== activeCategory) return false
      if (getPriceOptions(item).length === 0) return false
      if (!q) return true
      const src = [item.name, item.description]
      return src.some((s) => typeof s === 'string' && s.toLowerCase().includes(q))
    })
  }, [items, activeCategory, search])

  const addLine = (item: MenuItem, option: PriceOption) => {
    const key = `${item.id}::${option.suffix}`
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.key === key)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [
        ...prev,
        { key, name: item.name, suffix: option.suffix, unitPrice: option.price, quantity: 1 },
      ]
    })
  }

  const adjustQty = (key: string, delta: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.key === key ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0)
    )
  }

  const removeLine = (key: string) => setLines((prev) => prev.filter((l) => l.key !== key))
  const clearAll = () => setLines([])

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copyStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (copyStatusTimerRef.current) clearTimeout(copyStatusTimerRef.current)
    }
  }, [])

  const scheduleCopyStatusReset = () => {
    if (copyStatusTimerRef.current) clearTimeout(copyStatusTimerRef.current)
    copyStatusTimerRef.current = setTimeout(() => {
      setCopyStatus('idle')
      copyStatusTimerRef.current = null
    }, 1800)
  }

  const buildShareText = () => {
    if (lines.length === 0) return ''
    const itemLines = lines.map((l) => {
      const label = l.suffix ? `${l.name} (${l.suffix})` : l.name
      return `· ${label} × ${l.quantity} = ${(l.unitPrice * l.quantity).toLocaleString()}원`
    })
    return [
      '[파충류가게 메뉴 계산]',
      ...itemLines,
      '------',
      `합계: ${total.toLocaleString()}원`,
    ].join('\n')
  }

  const handleCopy = async () => {
    const text = buildShareText()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus('copied')
      scheduleCopyStatusReset()
    } catch {
      setCopyStatus('failed')
      scheduleCopyStatusReset()
    }
  }

  const handleShare = async () => {
    const text = buildShareText()
    if (!text) return
    const shareData: ShareData = { title: '파충류가게 메뉴 계산', text }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(shareData)
        return
      }
    } catch {
      // 사용자가 공유 취소 또는 브라우저 제한 → 복사로 fallback
    }
    await handleCopy()
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const handleSaveOrder = async () => {
    if (!user || lines.length === 0 || saveStatus === 'saving') return
    setSaveStatus('saving')
    const supabase = createClient()
    const payload = lines.map((l) => ({
      name: l.name,
      suffix: l.suffix,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
    }))
    const { error } = await supabase.from('order_history').insert({
      user_id: user.id,
      items: payload,
      total,
    })
    setSaveStatus(error ? 'failed' : 'saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const totalSection = (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
          총 합계
        </span>
        <span className="text-lg font-bold" style={{ color: '#C9A227' }}>
          {total.toLocaleString()}원
        </span>
      </div>

      {lines.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={copyStatus !== 'idle'}
              className="flex-1 text-xs font-semibold px-3 py-2 rounded-md border disabled:opacity-60"
              style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
            >
              {copyStatus === 'copied' ? '복사됨' : copyStatus === 'failed' ? '복사 실패' : '주문 텍스트 복사'}
            </button>
            {canShare && (
              <button
                type="button"
                onClick={handleShare}
                disabled={copyStatus !== 'idle'}
                className="flex-1 text-xs font-semibold px-3 py-2 rounded-md border disabled:opacity-60"
                style={{ color: '#F5F0E8', backgroundColor: '#456132', borderColor: '#C9A227' }}
              >
                공유
              </button>
            )}
          </div>
          {user && (
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              className="w-full text-xs font-semibold px-3 py-2 rounded-md border disabled:opacity-60"
              style={{ color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.3)', opacity: 0.85 }}
            >
              {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장됨 · 마이페이지에서 확인' : saveStatus === 'failed' ? '저장 실패' : '주문 기록에 저장'}
            </button>
          )}
        </>
      )}
    </div>
  )

  if (!isOpen || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-4 py-6 overflow-y-auto"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="glass-modal w-full max-w-4xl h-[calc(100vh-3rem)] sm:h-[85vh] sm:max-h-[720px] flex flex-col overflow-hidden p-4 sm:p-6 bg-[#F5F0E8] dark:bg-[#1A1A0F]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h3 id={titleId} className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
            <span style={{ color: '#C9A227' }}>·</span> 메뉴 계산기
          </h3>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border"
            style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(201,162,39,0.3)' }}
          >
            닫기
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden md:grid md:grid-cols-2 md:gap-5 md:items-stretch flex flex-col gap-5">
          <section className="flex flex-col min-w-0 md:min-h-0 md:h-full">
            <div
              className="flex flex-wrap gap-1.5 mb-3 shrink-0"
              role="tablist"
              aria-label="카테고리 선택"
            >
              {availableCategories.map((cat) => {
                const active = activeCategory === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setCategory(cat)}
                    className="text-xs px-2.5 py-1 rounded-md border transition-all"
                    style={
                      active
                        ? {
                            backgroundColor: '#456132',
                            color: '#F5F0E8',
                            borderColor: '#C9A227',
                            fontWeight: 600,
                          }
                        : {
                            color: 'var(--foreground)',
                            borderColor: 'rgba(201, 162, 39, 0.3)',
                            opacity: 0.75,
                          }
                    }
                  >
                    {CATEGORY_LABELS[cat] ?? cat}
                  </button>
                )
              })}
            </div>

            <input
              type="search"
              placeholder="메뉴 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm mb-3 shrink-0"
              style={{ color: 'var(--foreground)' }}
            />

            <div
              className="md:flex-1 md:min-h-0 md:overflow-y-auto pr-1 divide-y"
              style={{ borderColor: 'rgba(201,162,39,0.08)' }}
            >
              {visibleItems.length === 0 ? (
                <p className="text-center text-sm py-8" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                  조건에 맞는 메뉴가 없습니다.
                </p>
              ) : (
                visibleItems.map((item) => {
                  const options = getPriceOptions(item)
                  return (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
                    >
                      <span
                        className="flex-1 min-w-0 break-keep"
                        style={{ color: 'var(--foreground)', opacity: 0.9 }}
                      >
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-1.5">
                            {opt.suffix && (
                              <span
                                className="text-xs whitespace-nowrap"
                                style={{ color: 'var(--foreground)', opacity: 0.6 }}
                              >
                                {opt.suffix}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => addLine(item, opt)}
                              className="text-xs font-bold px-2 py-1 rounded-md border whitespace-nowrap"
                              style={{
                                color: '#C9A227',
                                borderColor: 'rgba(201,162,39,0.4)',
                              }}
                            >
                              {opt.price.toLocaleString()}원
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <section className="flex flex-col min-w-0 md:min-h-0 md:h-full">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                선택한 메뉴 ({lines.length})
              </h4>
              {lines.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs"
                  style={{ color: 'rgba(239,68,68,0.75)' }}
                >
                  전체 삭제
                </button>
              )}
            </div>

            <div
              className="md:flex-1 md:min-h-0 md:overflow-y-auto pr-1 divide-y"
              style={{ borderColor: 'rgba(201,162,39,0.1)' }}
            >
              {lines.length === 0 ? (
                <p className="text-center text-sm py-10" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                  좌측에서 메뉴를 선택하면 여기 쌓입니다.
                </p>
              ) : (
                lines.map((l) => (
                  <div key={l.key} className="flex items-start gap-2 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                        {l.name}
                        {l.suffix && (
                          <span className="text-xs ml-1" style={{ color: '#C9A227', opacity: 0.85 }}>
                            · {l.suffix}
                          </span>
                        )}
                      </p>
                      <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.75 }}>
                        {l.unitPrice.toLocaleString()}원 × {l.quantity} ={' '}
                        <span style={{ color: '#C9A227', opacity: 1 }}>
                          {(l.unitPrice * l.quantity).toLocaleString()}원
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustQty(l.key, -1)}
                        className="w-6 h-6 rounded border text-xs leading-none"
                        style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
                        aria-label="수량 감소"
                      >
                        −
                      </button>
                      <span
                        className="w-6 text-center text-xs"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {l.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustQty(l.key, 1)}
                        className="w-6 h-6 rounded border text-xs leading-none"
                        style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
                        aria-label="수량 증가"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLine(l.key)}
                        className="ml-1 w-6 h-6 text-sm leading-none"
                        style={{ color: 'rgba(239,68,68,0.65)' }}
                        aria-label="항목 삭제"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              className="mt-4 pt-3 shrink-0 hidden md:block"
              style={{ borderTop: '1px solid rgba(201, 162, 39, 0.3)' }}
            >
              {totalSection}
            </div>
          </section>
        </div>

        <div
          className="mt-3 pt-3 shrink-0 md:hidden"
          style={{ borderTop: '1px solid rgba(201, 162, 39, 0.3)' }}
        >
          {totalSection}
        </div>
      </div>
    </div>,
    document.body
  )
}
