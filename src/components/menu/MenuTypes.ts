import type { MenuCategory } from '@/types'

export type ViewMode = 'list' | 'photo'

export type MenuTabCategory = Exclude<MenuCategory, 'event_post'>

export const TAB_LABELS: Record<MenuTabCategory, string> = {
  event: 'Event / New',
  food: 'Food',
  signature: 'Signature',
  cocktail: 'Cocktail',
  beer: 'Beer',
  wine: 'Wine',
  whisky: 'Whisky',
  shochu: 'Shochu',
  spirits: 'Spirits',
  non_alcohol: 'Non-Alcohol',
  beverage: 'Beverage',
}
