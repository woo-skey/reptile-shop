export type UserRole = 'user' | 'admin'
export type PostType = 'community' | 'notice'

export interface Profile {
  id: string
  username: string
  display_name: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  author_id: string
  type: PostType
  title: string
  content: string
  image_urls: string[]
  is_pinned: boolean
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'username' | 'display_name'>
}

export type MenuCategory =
  | 'event'
  | 'event_post'
  | 'food'
  | 'non_alcohol'
  | 'beverage'
  | 'signature'
  | 'cocktail'
  | 'beer'
  | 'wine'
  | 'whisky'
  | 'shochu'
  | 'spirits'

export interface MenuItem {
  id: string
  category: MenuCategory
  subcategory: string | null
  image_url?: string | null
  name: string
  description: string | null
  note: string | null
  abv: number | null
  volume_ml: number | null
  price: number | null
  price_glass: number | null
  price_bottle: number | null
  sort_order: number
  is_available: boolean
  popular_order: number | null
  created_at: string
}

export interface Popup {
  id: string
  title: string
  content: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

export interface HomeNoticeBanner {
  key: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface StoreInfo {
  key: string
  address: string | null
  phone: string | null
  business_hours: string | null
  closed_days: string | null
  instagram_url: string | null
  kakao_url: string | null
  map_url: string | null
  extra_note: string | null
  updated_at: string
}

export type BannerAlign = 'left' | 'center' | 'right'
export type BannerTextSize = 'md' | 'lg' | 'xl'

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Pick<Profile, 'username' | 'display_name'>
}
