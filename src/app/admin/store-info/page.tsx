import { createClient } from '@/lib/supabase/server'
import StoreInfoForm from '@/components/admin/StoreInfoForm'
import type { StoreInfo } from '@/types'

export default async function AdminStoreInfoPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_info')
    .select('key, address, phone, business_hours, closed_days, instagram_url, kakao_url, map_url, extra_note, hero_image_url, updated_at')
    .eq('key', 'main')
    .maybeSingle()

  const info = (data ?? null) as StoreInfo | null

  return (
    <div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        매장 정보
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
        홈 하단 &ldquo;매장 정보&rdquo; 섹션에 노출됩니다. 비워두면 해당 항목은 표시되지 않습니다.
      </p>
      <div className="glass-card p-5 sm:p-6">
        <StoreInfoForm initialInfo={info} />
      </div>
    </div>
  )
}
