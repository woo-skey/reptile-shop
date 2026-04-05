import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'

const isImageColumnMissingError = (message: string) => {
  const normalized = message.toLowerCase()
  return normalized.includes('image_url') && (
    normalized.includes('schema cache') ||
    normalized.includes('column') ||
    normalized.includes('menu_items.image_url')
  )
}

export async function GET() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, note, image_url, sort_order, created_at')
    .eq('category', 'event_post')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error && isImageColumnMissingError(error.message)) {
    const fallback = await supabase
      .from('menu_items')
      .select('id, name, description, note, sort_order, created_at')
      .eq('category', 'event_post')
      .eq('is_available', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    }

    const items = (fallback.data ?? []).map((item) => ({ ...item, image_url: item.note ?? null }))
    return NextResponse.json({ items })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data ?? []).map((item) => ({
    ...item,
    image_url: item.image_url ?? item.note ?? null,
  }))

  return NextResponse.json({ items })
}
