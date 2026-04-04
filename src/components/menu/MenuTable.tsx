import { Fragment, type ReactNode } from 'react'
import type { MenuItem } from '@/types'

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
    const key = item.subcategory ?? '기타'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const na = parseInt(a)
    const nb = parseInt(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })

  return (
    <Table headers={['메뉴', '설명', '도수', '가격']}>
      {limited.length === 0 ? (
        <Empty />
      ) : (
        sortedKeys.map((key) => (
          <Fragment key={`group-${key}`}>
            <SubHead label={Number.isNaN(parseInt(key)) ? key : fmt(parseInt(key))} />
            {groups[key].map((item) => (
              <Row key={item.id} cells={[<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price)]} />
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
  rowLimit,
}: {
  items: MenuItem[]
  category: string
  rowLimit?: number | null
}) {
  switch (category) {
    case 'event':
      return <EventTable items={items} rowLimit={rowLimit} />
    case 'food':
      return <FoodTable items={items} rowLimit={rowLimit} />
    case 'signature':
      return <SignatureTable items={items} rowLimit={rowLimit} />
    case 'cocktail':
      return <CocktailTable items={items} rowLimit={rowLimit} />
    case 'beer':
      return <BeerTable items={items} rowLimit={rowLimit} />
    case 'wine':
      return <WineTable items={items} rowLimit={rowLimit} />
    case 'whisky':
      return <WhiskyTable items={items} rowLimit={rowLimit} />
    case 'shochu':
      return <GlassBottleTable items={items} rowLimit={rowLimit} />
    case 'spirits':
      return <GlassBottleTable items={items} rowLimit={rowLimit} />
    default:
      return null
  }
}
