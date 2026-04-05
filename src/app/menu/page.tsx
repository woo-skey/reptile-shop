import { createClient } from '@/lib/supabase/server'
import MenuClientPage from '@/components/menu/MenuClientPage'
import { TAB_LABELS, type RowOptionKey } from '@/components/menu/MenuTypes'
import type { MenuCategory, MenuItem } from '@/types'

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; rows?: string }>
}) {
  const { tab, rows } = await searchParams

  const activeTab = (Object.keys(TAB_LABELS) as MenuCategory[]).includes((tab ?? '') as MenuCategory)
    ? (tab as MenuCategory)
    : 'event'

  const activeRows = (rows === '2' || rows === '3' || rows === '5' ? rows : 'all') as RowOptionKey

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
      .eq('is_available', true)
      .order('category', { ascending: true })
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

      <MenuClientPage items={items} initialTab={activeTab} initialRows={activeRows} isAdmin={isAdmin} />
    </div>
  )
}
