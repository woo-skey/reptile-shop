'use client'

import { useMemo, useState } from 'react'
import ToggleRoleButton from '@/components/admin/ToggleRoleButton'
import type { Profile, UserRole } from '@/types'

type RoleFilter = 'all' | UserRole

const ROLE_FILTERS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'admin', label: '관리자' },
  { key: 'user', label: '단골' },
]

export default function AdminUsersList({ users }: { users: Profile[] }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<RoleFilter>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter((u) => {
      if (role !== 'all' && u.role !== role) return false
      if (!q) return true
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      )
    })
  }, [users, query, role])

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="이름 / 아이디 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="glass-input flex-1 min-w-[200px] px-3 py-2 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
        <div className="flex gap-1">
          {ROLE_FILTERS.map(({ key, label }) => {
            const active = role === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className="text-xs font-bold px-3 py-1.5 rounded-md border"
                style={
                  active
                    ? { backgroundColor: '#456132', color: '#F5F0E8', borderColor: '#C9A227' }
                    : { color: 'var(--foreground)', borderColor: 'rgba(201,162,39,0.3)', opacity: 0.75 }
                }
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
        전체 {users.length}명 중 {filtered.length}명 표시
      </p>

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {filtered.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            조건에 맞는 회원이 없습니다.
          </p>
        ) : (
          filtered.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium break-keep" style={{ color: 'var(--foreground)' }}>
                  {u.display_name}
                  <span className="ml-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                    @{u.username}
                  </span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                  {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  {u.role === 'admin' && (
                    <span className="ml-2" style={{ color: '#C9A227' }}>관리자</span>
                  )}
                </p>
              </div>
              <ToggleRoleButton userId={u.id} currentRole={u.role} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
