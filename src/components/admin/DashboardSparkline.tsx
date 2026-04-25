type Point = { label: string; value: number }

export default function DashboardSparkline({
  title,
  points,
  total,
}: {
  title: string
  points: Point[]
  total: number
}) {
  const max = Math.max(1, ...points.map((p) => p.value))

  return (
    <div className="glass-card px-5 py-4">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.55 }}>
          {title}
        </span>
        <span className="text-lg font-bold" style={{ color: '#C9A227' }}>
          {total}
        </span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {points.map((p, i) => {
          const heightPct = Math.round((p.value / max) * 100)
          return (
            <div
              key={i}
              className="flex-1 rounded-sm transition-all"
              title={`${p.label}: ${p.value}`}
              style={{
                backgroundColor: p.value > 0 ? '#456132' : 'rgba(201, 162, 39, 0.12)',
                height: `${Math.max(6, heightPct)}%`,
                opacity: p.value > 0 ? 0.85 : 0.6,
              }}
            />
          )
        })}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[10px]" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        <span>{points[0]?.label ?? ''}</span>
        <span>{points[points.length - 1]?.label ?? ''}</span>
      </div>
    </div>
  )
}
