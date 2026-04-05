'use client'

import type { RowOptionKey } from '@/components/menu/MenuTypes'

const ROW_OPTIONS = [
  { key: 'all', label: '전체 보기' },
  { key: '2', label: '2행 보기' },
  { key: '3', label: '3행 보기' },
  { key: '5', label: '5행 보기' },
] as const

function RowOptionIcon({ optionKey }: { optionKey: RowOptionKey }) {
  const lineCount = optionKey === 'all' ? 6 : parseInt(optionKey, 10)
  return (
    <span
      className="inline-grid w-5 h-4"
      style={{ gridTemplateRows: `repeat(${lineCount}, minmax(0, 1fr))`, rowGap: '2px' }}
      aria-hidden="true"
    >
      {Array.from({ length: lineCount }).map((_, index) => (
        <span
          key={`${optionKey}-${index}`}
          className="block w-full rounded-full bg-current"
          style={{ height: '2px' }}
        />
      ))}
    </span>
  )
}

export default function MenuRowOptions({
  activeRows,
  onChange,
}: {
  activeRows: RowOptionKey
  onChange: (rows: RowOptionKey) => void
}) {
  const handleOption = (key: RowOptionKey) => {
    if (key === activeRows) return
    onChange(key)
  }

  return (
    <div className="-mx-1 px-1 overflow-x-auto">
      <div className="flex gap-1 w-max min-w-full sm:min-w-0 sm:flex-wrap">
        {ROW_OPTIONS.map(({ key, label }) => {
          const rowKey = key as RowOptionKey
          const active = activeRows === rowKey
          return (
            <button
              key={key}
              onClick={() => handleOption(rowKey)}
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
              <RowOptionIcon optionKey={rowKey} />
              <span className="sr-only">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
