import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      <div className="glass-card p-8 text-center">
        <p className="text-xs tracking-[0.24em] mb-3" style={{ color: '#C9A227', opacity: 0.85 }}>
          404
        </p>
        <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
          주소가 변경되었거나 삭제되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm border"
          style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.35)' }}
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  )
}
