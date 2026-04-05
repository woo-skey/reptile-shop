export default function CommunityLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="glass-card p-5 animate-pulse">
            <div className="h-4 w-1/2 rounded mb-2" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
            <div className="h-3 w-11/12 rounded" style={{ backgroundColor: 'rgba(245,240,232,0.08)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
