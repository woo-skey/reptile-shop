import { createPublicClient } from '@/lib/supabase/public-server'
import EventClientPage from '@/components/event/EventClientPage'
import type { MenuItem } from '@/types'

export default async function EventPage() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .eq('category', 'event')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const items = (data ?? []) as MenuItem[]

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          Event
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          레프타일샵 이벤트
        </p>
      </div>

      <EventClientPage items={items} />
    </div>
  )
}
