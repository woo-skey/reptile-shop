import { NextResponse } from 'next/server'
import { createPublicClient } from '@/lib/supabase/public-server'

export async function GET() {
  const supabase = createPublicClient()

  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, description, image_url, sort_order, created_at')
    .eq('category', 'event_post')
    .eq('is_available', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data ?? [] })
}
