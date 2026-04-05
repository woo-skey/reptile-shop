import { Fragment, type ReactNode } from 'react'
import type { MenuCategory, MenuItem } from '@/types'
import type { ViewMode } from '@/components/menu/MenuTypes'

const fmt = (n: number | null) => (n != null ? `${n.toLocaleString('ko-KR')}원` : '-')
const abvStr = (n: number | null) => (n != null ? `${n}%` : '-')

const limitRows = (items: MenuItem[], rowLimit?: number | null) => {
  if (!rowLimit || rowLimit <= 0) return items
  return items.slice(0, rowLimit)
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[640px] md:min-w-0 text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(201,162,39,0.25)' }}>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2.5 px-2 md:px-3 text-xs font-semibold"
                style={{ color: '#C9A227', whiteSpace: 'nowrap' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

function NameCell({ item }: { item: MenuItem }) {
  const hasExternalImage = Boolean(item.image_url?.startsWith('http'))

  return (
    <div className="flex items-center gap-2 min-w-0">
      {hasExternalImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image_url ?? ''}
          alt={item.name}
          className="w-8 h-8 rounded object-cover shrink-0"
          style={{ border: '1px solid rgba(201,162,39,0.25)' }}
        />
      ) : item.image_url ? (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
          style={{ color: '#C9A227', border: '1px solid rgba(201,162,39,0.3)' }}
        >
          IMG
        </span>
      ) : null}

      <span className="truncate">{item.name}</span>
    </div>
  )
}

function Row({ cells }: { cells: (ReactNode | null | undefined)[] }) {
  return (
    <tr className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid rgba(201,162,39,0.08)' }}>
      {cells.map((c, i) => (
        <td
          key={i}
          className="py-3 px-2 md:px-3 align-top text-xs sm:text-sm"
          style={{ color: 'var(--foreground)', opacity: c == null || c === '' ? 0.35 : 0.85 }}
        >
          {c ?? '-'}
        </td>
      ))}
    </tr>
  )
}

function SubHead({ label }: { label: string }) {
  return (
    <tr>
      <td colSpan={10} className="pt-6 pb-2 px-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#C9A227' }}>
            {label}
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.2)' }} />
        </div>
      </td>
    </tr>
  )
}

function Empty() {
  return (
    <tr>
      <td colSpan={10} className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        등록된 메뉴가 없습니다.
      </td>
    </tr>
  )
}

const formatPhotoPrice = (item: MenuItem) => {
  if (item.price != null) return fmt(item.price)

  const parts: string[] = []
  if (item.price_glass != null) parts.push(`G ${fmt(item.price_glass)}`)
  if (item.price_bottle != null) parts.push(`B ${fmt(item.price_bottle)}`)
  return parts.length > 0 ? parts.join(' / ') : '-'
}

const getDisplayImage = (imageUrl: string | null | undefined) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
    return imageUrl
  }
  return null
}

const normalizeCocktailTierLabel = (rawTier: string) => {
  const tier = rawTier.trim()
  if (!tier) return '\uAC00\uACA9#\uAE30\uD0C0'
  if (tier.startsWith('\uAC00\uACA9#')) return tier
  if (tier.startsWith('#')) return `\uAC00\uACA9${tier}`
  if (/^\d+$/.test(tier)) return `\uAC00\uACA9#${tier}`
  return tier
}

const cocktailTierOrder = (tier: string) => {
  const match = tier.match(/\d+/)
  if (!match) return Number.MAX_SAFE_INTEGER
  const value = Number.parseInt(match[0], 10)
  return Number.isNaN(value) ? Number.MAX_SAFE_INTEGER : value
}

function PhotoGrid({ items }: { items: MenuItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        등록된 메뉴가 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-2">
      {items.map((item) => {
        const imageSrc = getDisplayImage(item.image_url)
        return (
          <div
            key={item.id}
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(201,162,39,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            <div
              className="aspect-square border-b flex items-center justify-center"
              style={{ borderColor: 'rgba(201,162,39,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' }}
            >
              {imageSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                  이미지 (1:1)
                </span>
              )}
            </div>

            <div className="px-3 py-2.5">
              <p className="text-sm truncate" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                {item.name}
              </p>
              <p className="text-xs mt-1 truncate" style={{ color: '#C9A227', opacity: 0.85 }}>
                {formatPhotoPrice(item)}
              </p>
              {item.description && (
                <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                  {item.description}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CocktailPhotoGrid({ items }: { items: MenuItem[] }) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        No items yet.
      </div>
    )
  }

  const groups = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.subcategory?.trim() || ''
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const diff = cocktailTierOrder(a) - cocktailTierOrder(b)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })

  return (
    <div className="space-y-10 py-2">
      {sortedKeys.map((tier) => (
        <section key={`cocktail-tier-${tier}`} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
              {normalizeCocktailTierLabel(tier)}
            </h3>
            <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,162,39,0.3)' }} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {groups[tier].map((item) => {
              const imageSrc = getDisplayImage(item.image_url)
              return (
                <article
                  key={item.id}
                  className="rounded-2xl overflow-hidden border"
                  style={{ borderColor: 'rgba(201,162,39,0.3)', backgroundColor: 'rgba(255,255,255,0.03)' }}
                >
                  <div
                    className="aspect-square border-b flex items-center justify-center"
                    style={{ borderColor: 'rgba(201,162,39,0.2)', backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    {imageSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.45 }}>
                        Image (1:1)
                      </span>
                    )}
                  </div>

                  <div className="px-3 py-2.5 min-h-[70px]">
                    <p className="text-sm truncate font-semibold" style={{ color: 'var(--foreground)', opacity: 0.9 }}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-xs mt-1 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.5 }}>
                        {item.description}
                      </p>
                    )}
                    {item.abv != null && (
                      <p className="text-xs mt-1" style={{ color: '#C9A227', opacity: 0.8 }}>
                        ABV {item.abv}%
                      </p>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function EventTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  return (
    <Table headers={['메뉴', '설명', '가격']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        limited.map((item) => (
          <Row key={item.id} cells={[<NameCell key="name" item={item} />, item.description, fmt(item.price)]} />
        ))
      )}
    </Table>
  )
}

function FoodTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  return (
    <Table headers={['메뉴', '설명', '비고', '가격']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        limited.map((item) => (
          <Row key={item.id} cells={[<NameCell key="name" item={item} />, item.description, item.note, fmt(item.price)]} />
        ))
      )}
    </Table>
  )
}

function SignatureTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  return (
    <Table headers={['메뉴', '설명', '도수', '가격']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        limited.map((item) => (
          <Row key={item.id} cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price)]} />
        ))
      )}
    </Table>
  )
}

function CocktailTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  const groups = limited.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.subcategory?.trim() || ''
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const diff = cocktailTierOrder(a) - cocktailTierOrder(b)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })

  return (
    <Table headers={['\uBA54\uB274', '\uC124\uBA85', '\uB3C4\uC218']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        sortedKeys.map((key) => (
          <Fragment key={`group-${key}`}>
            <SubHead label={normalizeCocktailTierLabel(key)} />
            {groups[key].map((item) => (
              <Row key={item.id} cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv)]} />
            ))}
          </Fragment>
        ))
      )}
    </Table>
  )
}

function BeerTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  return (
    <Table headers={['메뉴', '설명', '도수', '용량', '가격']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            cells={[
              <NameCell key="name" item={item} />,
              item.description,
              abvStr(item.abv),
              item.volume_ml != null ? `${item.volume_ml}ml` : '-',
              fmt(item.price),
            ]}
          />
        ))
      )}
    </Table>
  )
}

const WINE_SUBS = [
  { key: 'red', label: 'Red' },
  { key: 'white', label: 'White' },
  { key: 'sparkling', label: 'Sparkling' },
]

function WineTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  const bySubcat = (sub: string) => limited.filter((i) => i.subcategory === sub)

  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        WINE_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <Fragment key={`group-${key}`}>
              <SubHead label={label} />
              {rows.map((item) => (
                <Row
                  key={item.id}
                  cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]}
                />
              ))}
            </Fragment>
          )
        })
      )}
    </Table>
  )
}

const WHISKY_SUBS = [
  { key: 'single_malt', label: 'Single Malt' },
  { key: 'blended', label: 'Blended' },
  { key: 'bourbon', label: 'Bourbon' },
  { key: 'tennessee', label: 'Tennessee' },
]

function WhiskyTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  const bySubcat = (sub: string) => limited.filter((i) => i.subcategory === sub)

  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        WHISKY_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <Fragment key={`group-${key}`}>
              <SubHead label={label} />
              {rows.map((item) => (
                <Row
                  key={item.id}
                  cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]}
                />
              ))}
            </Fragment>
          )
        })
      )}
    </Table>
  )
}

function GlassBottleTable({ items, rowLimit }: { items: MenuItem[]; rowLimit?: number | null }) {
  const limited = limitRows(items, rowLimit)
  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]}
          />
        ))
      )}
    </Table>
  )
}

export default function MenuTable({
  items,
  category,
  viewMode,
}: {
  items: MenuItem[]
  category: MenuCategory
  viewMode: ViewMode
}) {
  if (viewMode === 'photo') {
    if (category === 'cocktail') {
      return <CocktailPhotoGrid items={items} />
    }

    return <PhotoGrid items={items} />
  }

  switch (category) {
    case 'event':
      return <EventTable items={items} />
    case 'food':
      return <FoodTable items={items} />
    case 'non_alcohol':
      return <EventTable items={items} />
    case 'beverage':
      return <EventTable items={items} />
    case 'signature':
      return <SignatureTable items={items} />
    case 'cocktail':
      return <CocktailTable items={items} />
    case 'beer':
      return <BeerTable items={items} />
    case 'wine':
      return <WineTable items={items} />
    case 'whisky':
      return <WhiskyTable items={items} />
    case 'shochu':
      return <GlassBottleTable items={items} />
    case 'spirits':
      return <GlassBottleTable items={items} />
    default:
      return null
  }
}
