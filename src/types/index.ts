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

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  profiles?: Pick<Profile, 'username' | 'display_name'>
}
