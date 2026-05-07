export default function Footer() {
  return (
    <footer
      className="border-t mt-auto py-8"
      style={{ borderColor: 'rgba(201, 162, 39, 0.15)' }}
      aria-label="사이트 푸터"
    >
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p
          className="text-lg font-bold mb-1"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          파충류가게
        </p>
        <p className="text-xs mb-4" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
          단골들만의 공간
        </p>

        <a
          href="https://www.instagram.com/reptile_shop2021"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="파충류가게 인스타그램 (새 창)"
          className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80 focus:opacity-100"
          style={{ color: 'var(--foreground)', opacity: 0.7 }}
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
            aria-hidden="true"
            focusable="false"
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
