const ensure = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`환경변수 ${name}이(가) 설정되지 않았습니다.`)
  }
  return value
}

export const getSupabaseUrl = () => ensure('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
export const getSupabaseAnonKey = () => ensure('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const getSupabaseServiceRoleKey = () => ensure('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
