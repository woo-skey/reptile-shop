import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MenuTabs from '@/components/menu/MenuTabs'
import MenuRowOptions from '@/components/menu/MenuRowOptions'
import MenuTable from '@/components/menu/MenuTable'
import MenuAddModalButton from '@/components/menu/MenuAddModalButton'
import type { MenuCategory, MenuItem } from '@/types'

const TAB_LABELS: Record<MenuCategory, string> = {
  event: 'Event / New',
  food: 'Food',
  signature: 'Signature',
  cocktail: 'Cocktail',
  beer: 'Beer',
  wine: 'Wine',
  whisky: 'Whisky',
  shochu: 'Shochu',
  spirits: 'Spirits',
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; rows?: string }>
}) {
  const { tab, rows } = await searchParams

  const activeTab = (Object.keys(TAB_LABELS) as MenuCategory[]).includes((tab ?? '') as MenuCategory)
    ? (tab as MenuCategory)
    : 'event'

  const activeRows = rows === '2' || rows === '3' || rows === '5' ? rows : 'all'
  const rowLimit = activeRows === 'all' ? null : parseInt(activeRows)

  const supabase = await createClient()
  const [
    { data },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from('menu_items')
      .select('*')
      .eq('category', activeTab)
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  const items = (data ?? []) as MenuItem[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          Menu
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          파충류가게 메뉴
        </p>
      </div>

      <Suspense>
        <MenuTabs activeTab={activeTab} />
      </Suspense>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          {TAB_LABELS[activeTab]}
        </h2>
        <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        {isAdmin && <MenuAddModalButton category={activeTab} />}
      </div>

      <div className="mb-6">
        <Suspense>
          <MenuRowOptions activeRows={activeRows} />
        </Suspense>
      </div>

      <div className="glass-card px-4 py-2">
        <MenuTable items={items} category={activeTab} rowLimit={rowLimit} />
      </div>
    </div>
  )
}
