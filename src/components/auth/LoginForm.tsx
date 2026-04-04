'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `${form.username}@reptile.local`,
      password: form.password,
    })

    if (signInError) {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          아이디
        </label>
        <input
          name="username"
          type="text"
          required
          value={form.username}
          onChange={handleChange}
          placeholder="아이디 입력"
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          비밀번호
        </label>
        <input
          name="password"
          type="password"
          required
          value={form.password}
          onChange={handleChange}
          placeholder="비밀번호 입력"
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
        style={{
          backgroundColor: '#456132',
          color: '#F5F0E8',
          border: '1px solid #C9A227',
        }}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
        계정이 없으신가요?{' '}
        <Link href="/signup" className="underline" style={{ color: '#C9A227' }}>
          회원가입
        </Link>
      </p>
    </form>
  )
}
