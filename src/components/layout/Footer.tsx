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
        <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
          단골들만의 공간
        </p>
      </div>
    </footer>
  )
}