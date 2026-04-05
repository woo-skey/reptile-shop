import type { MenuCategory } from '@/types'

export type RowOptionKey = 'all' | '2' | '3' | '5'

export const TAB_LABELS: Record<MenuCategory, string> = {
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
