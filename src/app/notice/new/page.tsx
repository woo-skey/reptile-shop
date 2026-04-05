import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import NoticeWriteForm from '@/components/notice/NoticeWriteForm'

export default async function NoticeNewPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/notice')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold"
          style={{ fontFamily: 'var(--font-playfair)', color: '#C9A227' }}
        >
          Notice
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
          공지 작성
        </p>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <NoticeWriteForm />
      </div>
    </div>
  )
}
