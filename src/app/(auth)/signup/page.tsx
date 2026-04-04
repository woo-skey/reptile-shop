import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: '"Playfair Display", serif', color: '#C9A227' }}
          >
            파충류가게
          </h1>
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
            Members Only
          </p>
          <div className="mt-3 h-px w-24 mx-auto" style={{ backgroundColor: '#C9A227', opacity: 0.4 }} />
        </div>

        {/* 회원가입 폼 */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--foreground)' }}>
            회원가입
          </h2>
          <SignupForm />
        </div>
      </div>
    </main>
  )
}