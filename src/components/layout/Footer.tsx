export default function Footer() {
  return (
    <footer
      className="border-t mt-auto py-8"
      style={{ borderColor: 'rgba(201, 162, 39, 0.15)' }}
    >
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p
          className="text-lg font-bold mb-1"
          style={{ fontFamily: '"Playfair Display", serif', color: '#C9A227' }}
        >
          파충류가게
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
          단골들만의 공간
        </p>

        {/* 인스타그램 */}
        <a
          href="https://www.instagram.com/reptile_shop2021"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ color: 'var(--foreground)', opacity: 0.5 }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
          </svg>
          <span className="text-xs">@reptile_shop2021</span>
        </a>
      </div>
    </footer>
  )
}
