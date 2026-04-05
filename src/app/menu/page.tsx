import { connection } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'
import { createPostImagesAdminClient, toRenderablePostImageUrl } from '@/lib/storage/postImages'
import MenuClientPage from '@/components/menu/MenuClientPage'
import type { MenuItem } from '@/types'

export default async function MenuPage() {
  await connection()

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

      <MenuClientPage items={items} initialTab="event" />
    </div>
  )
}
