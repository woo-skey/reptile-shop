import { createPublicClient } from '@/lib/supabase/public-server'
import { createPostImagesAdminClient, toRenderablePostImageUrl } from '@/lib/storage/postImages'
import MenuClientPage from '@/components/menu/MenuClientPage'
import { TAB_LABELS, type MenuTabCategory, type ViewMode } from '@/components/menu/MenuTypes'
import type { MenuItem } from '@/types'

export const revalidate = 30

type MenuPageSearchParams = {
  tab?: string | string[]
  view?: string | string[]
  q?: string | string[]
  sub?: string | string[]
}

const TAB_KEYS = Object.keys(TAB_LABELS) as MenuTabCategory[]
const WHISKY_SUB_KEYS = ['single_malt', 'blended', 'bourbon', 'tennessee'] as const

const getFirstSearchParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value

const parseMenuSearchParams = (searchParams: MenuPageSearchParams) => {
  const tabFromUrl = getFirstSearchParam(searchParams.tab)
  const viewFromUrl = getFirstSearchParam(searchParams.view)
  const queryFromUrl = getFirstSearchParam(searchParams.q)?.trim() ?? ''
  const subFromUrl = getFirstSearchParam(searchParams.sub)

  const tab = TAB_KEYS.includes((tabFromUrl ?? '') as MenuTabCategory)
    ? (tabFromUrl as MenuTabCategory)
    : 'event'
  const view: ViewMode = viewFromUrl === 'photo' ? 'photo' : 'list'
  const sub = tab === 'whisky' && (WHISKY_SUB_KEYS as readonly string[]).includes(subFromUrl ?? '')
    ? (subFromUrl as string)
    : (tab === 'whisky' ? 'single_malt' : '')

  return { tab, view, query: queryFromUrl, sub }
}

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<MenuPageSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const initialState = parseMenuSearchParams(resolvedSearchParams)

  const supabase = createPublicClient()
  const { data } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .neq('category', 'event_post')
    .order('category', { ascending: true })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const rawItems = (data ?? []) as MenuItem[]
  const storageAdminClient = createPostImagesAdminClient()

  const items = await Promise.all(
    rawItems.map(async (item) => {
      const sourceImage = item.category === 'event'
        ? (item.image_url ?? item.note)
        : item.image_url

      const imageUrl = await toRenderablePostImageUrl(sourceImage, storageAdminClient)
      return {
        ...item,
        image_url: imageUrl,
      }
    })
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
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

      <MenuClientPage
        items={items}
        initialTab={initialState.tab}
        initialView={initialState.view}
        initialQuery={initialState.query}
        initialSub={initialState.sub}
      />
    </div>
  )
}
