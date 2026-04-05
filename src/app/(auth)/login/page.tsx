import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
          >
            파충류가게
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            Members Only
          </p>
          <div className="mt-3 h-px w-24 mx-auto" style={{ backgroundColor: '#C9A227', opacity: 0.4 }} />
        </div>

        {/* 로그인 폼 */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
            로그인
          </h2>
          <LoginForm />
        </div>
      </div>
    </main>
  )
}
