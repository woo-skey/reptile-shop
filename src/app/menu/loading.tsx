export default function MenuLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="glass-card p-6 animate-pulse">
        <div className="h-7 w-40 rounded mb-6" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        <div className="space-y-3">
          <div className="h-11 rounded" style={{ backgroundColor: 'rgba(245,240,232,0.08)' }} />
          <div className="h-11 rounded" style={{ backgroundColor: 'rgba(245,240,232,0.08)' }} />
          <div className="h-11 rounded" style={{ backgroundColor: 'rgba(245,240,232,0.08)' }} />
          <div className="h-11 rounded" style={{ backgroundColor: 'rgba(245,240,232,0.08)' }} />
        </div>
      </div>
    </div>
  )
}

