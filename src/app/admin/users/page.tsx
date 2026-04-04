import { createClient } from '@/lib/supabase/server'
import ToggleRoleButton from '@/components/admin/ToggleRoleButton'
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

      <div className="glass-card divide-y divide-[rgba(201,162,39,0.1)]">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {u.display_name}
                <span className="ml-2 text-xs" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                  @{u.username}
                </span>
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                {new Date(u.created_at).toLocaleDateString('ko-KR')}
                {u.role === 'admin' && (
                  <span className="ml-2" style={{ color: '#C9A227' }}>관리자</span>
                )}
              </p>
            </div>
            <ToggleRoleButton userId={u.id} currentRole={u.role} />
          </div>
        ))}
      </div>
    </div>
  )
}
