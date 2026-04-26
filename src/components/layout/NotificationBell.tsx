'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

const formatRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60_000)
  if (min < 1) return '방금'
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'short', day: 'numeric' })
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => !n.is_read).length

  const load = useCallback(async () => {
    if (!user) return
    const supabase = createClient()
    const { data } = await supabase
      .from('notifications')
      .select('id, type, title, body, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    setItems((data ?? []) as Notification[])
  }, [user])

  useEffect(() => {
    if (!user) {
      setItems([])
      return
    }
    void load()
    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const incoming = payload.new as Notification
          setItems((prev) => {
            if (prev.some((n) => n.id === incoming.id)) return prev
            return [incoming, ...prev].slice(0, 20)
          })
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user, load])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const markAllRead = async () => {
    if (!user || unread === 0) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const onItemClick = async (n: Notification) => {
    setOpen(false)
    if (n.is_read) return
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)))
  }

  if (!user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="알림"
        onClick={() => setOpen((v) => !v)}
        className="relative p-1.5 rounded-md transition-colors"
        style={{ color: 'rgba(245, 240, 232, 0.7)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: '#C9A227', color: '#1A1A0F' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto rounded-lg border shadow-xl z-50"
          style={{
            backgroundColor: 'rgba(26, 26, 15, 0.98)',
            borderColor: 'rgba(201, 162, 39, 0.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b sticky top-0"
            style={{ borderColor: 'rgba(201, 162, 39, 0.18)', backgroundColor: 'rgba(26, 26, 15, 0.98)' }}
          >
            <span className="text-sm font-semibold" style={{ color: '#C9A227' }}>알림</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs"
                style={{ color: 'rgba(245, 240, 232, 0.5)' }}
              >
                모두 읽음 처리
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-center text-sm py-8" style={{ color: 'rgba(245, 240, 232, 0.4)' }}>
              알림이 없습니다.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: 'rgba(201, 162, 39, 0.08)' }}>
              {items.map((n) => {
                const inner = (
                  <div
                    className="px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ opacity: n.is_read ? 0.6 : 1 }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: '#C9A227' }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs break-keep" style={{ color: 'rgba(245, 240, 232, 0.9)' }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5 break-keep truncate" style={{ color: 'rgba(245, 240, 232, 0.5)' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] mt-1" style={{ color: 'rgba(245, 240, 232, 0.35)' }}>
                          {formatRelative(n.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => onItemClick(n)} className="block">
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => onItemClick(n)} className="w-full text-left">
                        {inner}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
