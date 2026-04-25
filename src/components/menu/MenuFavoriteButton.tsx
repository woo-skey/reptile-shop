'use client'

type Size = 'sm' | 'md'

export default function MenuFavoriteButton({
  isFavorited,
  onToggle,
  disabled = false,
  size = 'sm',
}: {
  isFavorited: boolean
  onToggle: () => void
  disabled?: boolean
  size?: Size
}) {
  const dim = size === 'sm' ? 14 : 18
  const padding = size === 'sm' ? 'p-1' : 'p-1.5'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (!disabled) onToggle()
      }}
      disabled={disabled}
      className={`${padding} rounded-md transition-colors shrink-0 disabled:opacity-40`}
      aria-label={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      aria-pressed={isFavorited}
      style={{
        color: isFavorited ? '#C9A227' : 'rgba(245, 240, 232, 0.4)',
      }}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 24 24"
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  )
}
