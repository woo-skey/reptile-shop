import { createClient } from '@/lib/supabase/server'
import { createPostImagesAdminClient, toRenderablePostImageUrl } from '@/lib/storage/postImages'
import MainBannerForm from '@/components/admin/MainBannerForm'

export default async function AdminMainBannerPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('store_info')
    .select('hero_image_url')
    .eq('key', 'main')
    .maybeSingle()

  const heroPath = (data?.hero_image_url as string | null | undefined) ?? null
  const storageAdminClient = createPostImagesAdminClient()
  const renderable = heroPath
    ? await toRenderablePostImageUrl(heroPath, storageAdminClient)
    : null

  return (
    <div>
      <h2 className="text-base font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        메인 배너 이미지
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
        홈 상단에 노출되는 가로 배너 이미지입니다. 값이 비어있으면 기본 이미지가 사용됩니다.
      </p>
      <div className="glass-card p-5 sm:p-6">
        <MainBannerForm initialImageUrl={heroPath} initialRenderableUrl={renderable} />
      </div>
    </div>
  )
}
