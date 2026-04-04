import type { MenuItem } from '@/types'

const fmt = (n: number | null) =>
  n != null ? n.toLocaleString('ko-KR') + '원' : '-'

const abvStr = (n: number | null) =>
  n != null ? `${n}%` : '-'

/* ─── 공통 테이블 래퍼 ─── */
function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(201,162,39,0.25)' }}>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left py-2.5 px-3 text-xs font-semibold"
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

function Row({ cells }: { cells: (string | null | undefined)[] }) {
  return (
    <tr
      className="transition-colors hover:bg-white/5"
      style={{ borderBottom: '1px solid rgba(201,162,39,0.08)' }}
    >
      {cells.map((c, i) => (
        <td key={i} className="py-3 px-3 align-top text-sm" style={{ color: 'var(--foreground)', opacity: c ? 0.85 : 0.3 }}>
          {c ?? '-'}
        </td>
      ))}
    </tr>
  )
}

/* ─── 서브카테고리 제목 ─── */
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

/* ─── 빈 상태 ─── */
function Empty() {
  return (
    <tr>
      <td colSpan={10} className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        등록된 메뉴가 없습니다.
      </td>
    </tr>
  )
}

/* ─────────────────────────────────────────
   카테고리별 렌더러
───────────────────────────────────────── */

function EventTable({ items }: { items: MenuItem[] }) {
  return (
    <Table headers={['메뉴', '설명', '가격']}>
      {items.length === 0 ? <Empty /> : items.map((item) => (
        <Row key={item.id} cells={[item.name, item.description, fmt(item.price)]} />
      ))}
    </Table>
  )
}

function FoodTable({ items }: { items: MenuItem[] }) {
  return (
    <Table headers={['메뉴', '설명', '비고', '가격']}>
      {items.length === 0 ? <Empty /> : items.map((item) => (
        <Row key={item.id} cells={[item.name, item.description, item.note, fmt(item.price)]} />
      ))}
    </Table>
  )
}

function SignatureTable({ items }: { items: MenuItem[] }) {
  return (
    <Table headers={['메뉴', '설명', '도수', '가격']}>
      {items.length === 0 ? <Empty /> : items.map((item) => (
        <Row key={item.id} cells={[item.name, item.description, abvStr(item.abv), fmt(item.price)]} />
      ))}
    </Table>
  )
}

function CocktailTable({ items }: { items: MenuItem[] }) {
  // subcategory = 가격 티어 (예: '12000', '15000')
  const groups = items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.subcategory ?? '기타'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const na = parseInt(a), nb = parseInt(b)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return a.localeCompare(b)
  })

  return (
    <Table headers={['메뉴', '설명', '도수', '가격']}>
      {items.length === 0 ? (
        <Empty />
      ) : (
        sortedKeys.map((key) => (
          <>
            <SubHead key={`head-${key}`} label={isNaN(parseInt(key)) ? key : fmt(parseInt(key))} />
            {groups[key].map((item) => (
              <Row key={item.id} cells={[item.name, item.description, abvStr(item.abv), fmt(item.price)]} />
            ))}
          </>
        ))
      )}
    </Table>
  )
}

function BeerTable({ items }: { items: MenuItem[] }) {
  return (
    <Table headers={['메뉴', '설명', '도수', '용량', '가격']}>
      {items.length === 0 ? <Empty /> : items.map((item) => (
        <Row key={item.id} cells={[
          item.name,
          item.description,
          abvStr(item.abv),
          item.volume_ml != null ? `${item.volume_ml}ml` : '-',
          fmt(item.price),
        ]} />
      ))}
    </Table>
  )
}

const WINE_SUBS = [
  { key: 'red',       label: 'Red' },
  { key: 'white',     label: 'White' },
  { key: 'sparkling', label: 'Sparkling' },
]

function WineTable({ items }: { items: MenuItem[] }) {
  const bySubcat = (sub: string) => items.filter((i) => i.subcategory === sub)
  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {items.length === 0 ? (
        <Empty />
      ) : (
        WINE_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <>
              <SubHead key={`head-${key}`} label={label} />
              {rows.map((item) => (
                <Row key={item.id} cells={[item.name, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]} />
              ))}
            </>
          )
        })
      )}
    </Table>
  )
}

const WHISKY_SUBS = [
  { key: 'single_malt', label: 'Single Malt' },
  { key: 'blended',     label: 'Blended' },
  { key: 'bourbon',     label: 'Bourbon' },
  { key: 'tennessee',   label: 'Tennessee' },
]

function WhiskyTable({ items }: { items: MenuItem[] }) {
  const bySubcat = (sub: string) => items.filter((i) => i.subcategory === sub)
  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {items.length === 0 ? (
        <Empty />
      ) : (
        WHISKY_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <>
              <SubHead key={`head-${key}`} label={label} />
              {rows.map((item) => (
                <Row key={item.id} cells={[item.name, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]} />
              ))}
            </>
          )
        })
      )}
    </Table>
  )
}

function GlassBottleTable({ items }: { items: MenuItem[] }) {
  return (
    <Table headers={['메뉴', '설명', '도수', '1 Glass', '1 Bottle']}>
      {items.length === 0 ? <Empty /> : items.map((item) => (
        <Row key={item.id} cells={[item.name, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)]} />
      ))}
    </Table>
  )
}

/* ─── 메인 익스포트 ─── */
export default function MenuTable({ items, category }: { items: MenuItem[]; category: string }) {
  switch (category) {
    case 'event':     return <EventTable items={items} />
    case 'food':      return <FoodTable items={items} />
    case 'signature': return <SignatureTable items={items} />
    case 'cocktail':  return <CocktailTable items={items} />
    case 'beer':      return <BeerTable items={items} />
    case 'wine':      return <WineTable items={items} />
    case 'whisky':    return <WhiskyTable items={items} />
    case 'shochu':    return <GlassBottleTable items={items} />
    case 'spirits':   return <GlassBottleTable items={items} />
    default:          return null
  }
}
