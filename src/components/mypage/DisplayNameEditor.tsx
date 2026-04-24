'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DisplayNameEditor({ initialName }: { initialName: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [value, setValue] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const openEdit = () => {
    setError('')
    setValue(name)
    setEditing(true)
  }

  const cancel = () => {
    setError('')
    setEditing(false)
    setValue(name)
  }

  const save = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError('이름을 입력해주세요.')
      return
    }
    if (trimmed === name) {
      setEditing(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: trimmed }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: '이름 변경에 실패했습니다.' }))
        setError(data.error ?? '이름 변경에 실패했습니다.')
        setLoading(false)
        return
      }
      setName(trimmed)
      setEditing(false)
      setLoading(false)
      router.refresh()
    } catch {
      setError('네트워크 오류로 이름 변경에 실패했습니다.')
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <p className="font-semibold text-base" style={{ color: 'var(--foreground)' }}>
          {name}
        </p>
        <button
          type="button"
          onClick={openEdit}
          className="text-xs px-2 py-0.5 rounded border"
          style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
        >
          수정
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          disabled={loading}
          className="glass-input px-2 py-1 text-sm"
          style={{ color: 'var(--foreground)' }}
          autoFocus
        />
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded border disabled:opacity-50"
          style={{ color: '#F5F0E8', backgroundColor: '#456132', borderColor: '#C9A227' }}
        >
          {loading ? '저장 중' : '저장'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={loading}
          className="text-xs px-2.5 py-1 rounded border disabled:opacity-50"
          style={{ color: 'var(--foreground)', opacity: 0.6, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          취소
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
