'use client'

import type { ViewMode } from '@/components/menu/MenuTypes'

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: 'list', label: '리스트 형식' },
  { key: 'photo', label: '사진 형식' },
]

function ViewModeIcon({ mode }: { mode: ViewMode }) {
  if (mode === 'list') {
    return (
      <span
        className="inline-grid w-5 h-4"
        style={{ gridTemplateRows: 'repeat(3, minmax(0, 1fr))', rowGap: '2px' }}
        aria-hidden="true"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={`list-${index}`} className="block w-full rounded-full bg-current" style={{ height: '2px' }} />
        ))}
      </span>
    )
  }

  return (
    <span className="inline-grid w-5 h-4 grid-cols-2 gap-1" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <span key={`photo-${index}`} className="block rounded-[2px] bg-current" />
      ))}
    </span>
  )
}

export default function MenuRowOptions({
  activeMode,
  onChange,
}: {
  activeMode: ViewMode
  onChange: (mode: ViewMode) => void
}) {
  const handleOption = (key: ViewMode) => {
    if (key === activeMode) return
    onChange(key)
  }

  return (
    <div className="-mx-1 px-1 overflow-x-auto">
      <div className="flex gap-1 w-max min-w-full sm:min-w-0 sm:flex-wrap">
        {VIEW_OPTIONS.map(({ key, label }) => {
          const active = activeMode === key
          return (
            <button
              key={key}
              onClick={() => handleOption(key)}
              className="shrink-0 inline-flex items-center justify-center w-10 h-8 text-xs rounded-md border transition-all"
              aria-label={label}
              title={label}
              style={{
                backgroundColor: active ? 'rgba(69,97,50,0.7)' : 'transparent',
                color: active ? '#F5F0E8' : 'rgba(245, 240, 232, 0.6)',
                borderColor: active ? '#C9A227' : 'rgba(201, 162, 39, 0.2)',
                fontWeight: active ? 600 : 400,
              }}
            >
              <ViewModeIcon mode={key} />
              <span className="sr-only">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
