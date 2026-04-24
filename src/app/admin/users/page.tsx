import { createClient } from '@/lib/supabase/server'
import AdminUsersList from '@/components/admin/AdminUsersList'
import type { Profile } from '@/types'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  const users = (data ?? []) as Profile[]

  return (
    <div>
      <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        회원 목록 ({users.length}명)
      </h2>
      <AdminUsersList users={users} />
    </div>
  )
}
