'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/

export default function SignupForm() {
  const router = useRouter()
  const [form, setForm] = useState({ displayName: '', username: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!USERNAME_PATTERN.test(form.username)) {
      setError('아이디는 영문/숫자/언더스코어(_)만 사용하여 3~20자로 입력해주세요.')
      return
    }
    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email: `${form.username}@reptile.local`,
      password: form.password,
      options: {
        data: {
          username: form.username,
          display_name: form.displayName,
        },
      },
    })

    if (signUpError) {
      const raw = signUpError.message.toLowerCase()
      if (raw.includes('already registered') || raw.includes('user already')) {
        setError('이미 사용 중인 아이디입니다.')
      } else if (raw.includes('password')) {
        setError('비밀번호 형식이 올바르지 않습니다.')
      } else if (raw.includes('rate limit') || raw.includes('too many')) {
        setError('잠시 후 다시 시도해주세요.')
      } else {
        // 내부 fake email 패턴이 노출되지 않도록 사용자에겐 일반 메시지만 노출
        setError('회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.')
      }
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
          이름
        </label>
        <input
          name="displayName"
          type="text"
          required
          value={form.displayName}
          onChange={handleChange}
          placeholder="홍길동"
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

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
          placeholder="사용할 아이디 입력"
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
          placeholder="6자 이상"
          className="glass-input w-full px-4 py-2.5 text-sm"
          style={{ color: 'var(--foreground)' }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>
          비밀번호 확인
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          value={form.confirmPassword}
          onChange={handleChange}
          placeholder="비밀번호 재입력"
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
        {loading ? '가입 중...' : '회원가입'}
      </button>

      <p className="text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="underline" style={{ color: '#C9A227' }}>
          로그인
        </Link>
      </p>
    </form>
  )
}
