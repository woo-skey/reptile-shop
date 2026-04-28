import type { StoreInfo } from '@/types'

const normalizeUrl = (raw: string | null) => {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export default function StoreInfoSection({ info }: { info: StoreInfo | null }) {
  if (!info) return null

  const hasAny =
    info.address ||
    info.phone ||
    info.business_hours ||
    info.closed_days ||
    info.instagram_url ||
    info.kakao_url ||
    info.map_url ||
    info.extra_note

  if (!hasAny) return null

  const instagram = normalizeUrl(info.instagram_url)
  const kakao = normalizeUrl(info.kakao_url)
  const map = normalizeUrl(info.map_url)

  return (
    <section className="glass-card p-5 md:p-6">
      <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>
        <span aria-hidden="true" style={{ color: '#C9A227' }}>·</span> 매장 정보
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {info.address && (
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#C9A227', opacity: 0.85 }}>
              주소
            </p>
            <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.88 }}>
              {info.address}
            </p>
          </div>
        )}

        {info.phone && (
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#C9A227', opacity: 0.85 }}>
              연락처
            </p>
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.88 }}>
              <a href={`tel:${info.phone.replace(/\s+/g, '')}`} className="hover:underline">
                {info.phone}
              </a>
            </p>
          </div>
        )}

        {info.business_hours && (
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#C9A227', opacity: 0.85 }}>
              영업시간
            </p>
            <p className="text-sm whitespace-pre-line break-keep" style={{ color: 'var(--foreground)', opacity: 0.88 }}>
              {info.business_hours}
            </p>
          </div>
        )}

        {info.closed_days && (
          <div>
            <p className="text-xs mb-0.5" style={{ color: '#C9A227', opacity: 0.85 }}>
              휴무일
            </p>
            <p className="text-sm break-keep" style={{ color: 'var(--foreground)', opacity: 0.88 }}>
              {info.closed_days}
            </p>
          </div>
        )}

        {info.extra_note && (
          <div className="sm:col-span-2">
            <p className="text-xs mb-0.5" style={{ color: '#C9A227', opacity: 0.85 }}>
              안내
            </p>
            <p className="text-sm whitespace-pre-line break-keep" style={{ color: 'var(--foreground)', opacity: 0.78 }}>
              {info.extra_note}
            </p>
          </div>
        )}
      </div>

      {(instagram || kakao || map) && (
        <div className="mt-5 pt-4 flex flex-wrap gap-2" style={{ borderTop: '1px solid rgba(201,162,39,0.18)' }}>
          {map && (
            <a
              href={map}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-md border"
              style={{ color: '#F5F0E8', backgroundColor: '#456132', borderColor: '#C9A227' }}
            >
              지도 열기
            </a>
          )}
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-md border"
              style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
            >
              Instagram
            </a>
          )}
          {kakao && (
            <a
              href={kakao}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-md border"
              style={{ color: '#C9A227', borderColor: 'rgba(201,162,39,0.4)' }}
            >
              카카오톡 채널
            </a>
          )}
        </div>
      )}
    </section>
  )
}
