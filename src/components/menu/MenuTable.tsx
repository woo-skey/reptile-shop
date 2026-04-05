import { Fragment, type ReactNode } from 'react'
import MenuEditModalButton from '@/components/menu/MenuEditModalButton'
import type { MenuCategory, MenuItem } from '@/types'
import type { ViewMode } from '@/components/menu/MenuTypes'

const fmt = (n: number | null) => (n != null ? `${n.toLocaleString('ko-KR')}원` : '-')
const abvStr = (n: number | null) => (n != null ? `${n}%` : '-')

const limitRows = (items: MenuItem[], rowLimit?: number | null) => {
  if (!rowLimit || rowLimit <= 0) return items
  return items.slice(0, rowLimit)
}

const headersWithEdit = (headers: string[], isAdmin: boolean) =>
  isAdmin ? [...headers, ''] : headers

const parseCocktailTierAmount = (rawTier: string) => {
  const numericText = rawTier.replace(/,/g, '').match(/\d+/)?.[0]
  if (!numericText) return null

  const value = Number.parseInt(numericText, 10)
  return Number.isNaN(value) ? null : value
}

const normalizeCocktailTierLabel = (rawTier: string) => {
  const tier = rawTier.trim()
  if (!tier) return '기타'

  const amount = parseCocktailTierAmount(tier)
  if (amount == null) return tier

  return `${amount.toLocaleString('ko-KR')}원`
}

const cocktailTierOrder = (tier: string) => {
  const amount = parseCocktailTierAmount(tier)
  if (amount == null) return Number.MAX_SAFE_INTEGER
  return amount
}

const getDisplayImage = (item: MenuItem) => {
  const imageUrl = item.image_url ?? ((item.category === 'event' || item.category === 'event_post') ? item.note : null)
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('/')) {
    return imageUrl
  }
  return null
}

function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full min-w-[640px] md:min-w-0 text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(201,162,39,0.25)' }}>
            {headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                className={`py-2.5 px-2 md:px-3 text-xs font-semibold ${i === headers.length - 1 && h === '' ? 'text-right' : 'text-left'}`}
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
  const supportsImage = item.category === 'event' || item.category === 'food'
  const imageUrl = supportsImage
    ? (item.image_url ?? (item.category === 'event' ? item.note : null))
    : null
  const hasExternalImage = Boolean(
    imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://') || imageUrl?.startsWith('/')
  )

  return (
    <div className="flex items-center gap-2 min-w-0">
      {hasExternalImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl ?? ''}
          alt={item.name}
          className="w-8 h-8 rounded object-cover shrink-0"
          style={{ border: '1px solid rgba(201,162,39,0.25)' }}
        />
      ) : imageUrl ? (
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

type ListDragContext = {
  enabled: boolean
  draggingId: string | null
  onDragStart: (id: string) => void
  onDragEnd: () => void
  onDrop: (id: string) => void
}

function Row({
  cells,
  itemId,
  dragContext,
}: {
  cells: (ReactNode | null | undefined)[]
  itemId?: string
  dragContext?: ListDragContext
}) {
  const isDraggable = Boolean(dragContext?.enabled && itemId)
  const isDragging = Boolean(isDraggable && dragContext?.draggingId === itemId)

  return (
    <tr
      draggable={isDraggable}
      onDragStart={
        isDraggable && itemId && dragContext
          ? () => dragContext.onDragStart(itemId)
          : undefined
      }
      onDragEnd={isDraggable && dragContext ? dragContext.onDragEnd : undefined}
      onDragOver={isDraggable ? (event) => event.preventDefault() : undefined}
      onDrop={
        isDraggable && itemId && dragContext
          ? () => dragContext.onDrop(itemId)
          : undefined
      }
      className="transition-colors hover:bg-white/5"
      style={{
        borderBottom: '1px solid rgba(201,162,39,0.08)',
        cursor: isDraggable ? 'grab' : 'default',
        backgroundColor: isDragging ? 'rgba(69,97,50,0.22)' : undefined,
      }}
    >
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

function SubHead({ label, colSpan }: { label: string; colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="pt-6 pb-2 px-3">
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

function Empty({ colSpan, message = '등록된 메뉴가 없습니다.' }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        {message}
      </td>
    </tr>
  )
}

function EditCell({
  item,
  isAdmin,
  onItemUpdated,
  onItemDeleted,
}: {
  item: MenuItem
  isAdmin: boolean
  onItemUpdated?: (updated: MenuItem) => void
  onItemDeleted?: (deletedId: string) => void
}) {
  if (!isAdmin || !onItemUpdated) return null

  return (
    <div className="flex justify-end">
      <MenuEditModalButton item={item} onUpdated={onItemUpdated} onDeleted={onItemDeleted} />
    </div>
  )
}

const withEditCell = (
  cells: (ReactNode | null | undefined)[],
  item: MenuItem,
  isAdmin: boolean,
  onItemUpdated?: (updated: MenuItem) => void,
  onItemDeleted?: (deletedId: string) => void
) => {
  if (!isAdmin || !onItemUpdated) return cells
  return [
    ...cells,
    <EditCell
      key={`edit-${item.id}`}
      item={item}
      isAdmin={isAdmin}
      onItemUpdated={onItemUpdated}
      onItemDeleted={onItemDeleted}
    />,
  ]
}

const formatPhotoPrice = (item: MenuItem) => {
  if (item.price != null) return fmt(item.price)

  const parts: string[] = []
  if (item.price_glass != null) parts.push(`G ${fmt(item.price_glass)}`)
  if (item.price_bottle != null) parts.push(`B ${fmt(item.price_bottle)}`)
  return parts.length > 0 ? parts.join(' / ') : '-'
}

function PhotoGrid({
  items,
  isAdmin,
  onItemUpdated,
  onItemDeleted,
  emptyMessage = '등록된 메뉴가 없습니다.',
}: {
  items: MenuItem[]
  isAdmin: boolean
  onItemUpdated?: (updated: MenuItem) => void
  onItemDeleted?: (deletedId: string) => void
  emptyMessage?: string
}) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 py-2">
      {items.map((item) => {
        const imageSrc = getDisplayImage(item)
        return (
          <article
            key={item.id}
            className="relative rounded-2xl overflow-hidden border"
            style={{ borderColor: 'rgba(201,162,39,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
          >
            {isAdmin && onItemUpdated && (
              <div className="absolute top-2 right-2 z-10">
                <MenuEditModalButton item={item} onUpdated={onItemUpdated} onDeleted={onItemDeleted} />
              </div>
            )}

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
          </article>
        )
      })}
    </div>
  )
}

type TableRendererProps = {
  items: MenuItem[]
  rowLimit?: number | null
  isAdmin: boolean
  onItemUpdated?: (updated: MenuItem) => void
  onItemDeleted?: (deletedId: string) => void
  dragContext?: ListDragContext
}

function EventTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['제목', '내용'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} message="등록된 이벤트가 없습니다." />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell([<NameCell key="name" item={item} />, item.description], item, isAdmin, onItemUpdated, onItemDeleted)}
          />
        ))
      )}
    </Table>
  )
}

function SimplePriceTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['메뉴', '설명', '가격'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell([<NameCell key="name" item={item} />, item.description, fmt(item.price)], item, isAdmin, onItemUpdated, onItemDeleted)}
          />
        ))
      )}
    </Table>
  )
}

function FoodTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['메뉴', '설명', '비고', '가격'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell(
              [<NameCell key="name" item={item} />, item.description, item.note, fmt(item.price)],
              item,
              isAdmin,
              onItemUpdated,
              onItemDeleted
            )}
          />
        ))
      )}
    </Table>
  )
}

function SignatureTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['메뉴', '설명', '도수', '가격'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell(
              [<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price)],
              item,
              isAdmin,
              onItemUpdated,
              onItemDeleted
            )}
          />
        ))
      )}
    </Table>
  )
}

function CocktailTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const groups = limited.reduce<Record<string, MenuItem[]>>((acc, item) => {
    const key = item.subcategory?.trim() || ''
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const headers = headersWithEdit(['메뉴', '설명', '도수'], isAdmin)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const diff = cocktailTierOrder(a) - cocktailTierOrder(b)
    if (diff !== 0) return diff
    return a.localeCompare(b)
  })

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        sortedKeys.map((key) => (
          <Fragment key={`group-${key}`}>
            <SubHead label={normalizeCocktailTierLabel(key)} colSpan={headers.length} />
            {groups[key].map((item) => (
              <Row
                key={item.id}
                itemId={item.id}
                dragContext={dragContext}
                cells={withEditCell(
                  [<NameCell key="name" item={item} />, item.description, abvStr(item.abv)],
                  item,
                  isAdmin,
                  onItemUpdated,
                  onItemDeleted
                )}
              />
            ))}
          </Fragment>
        ))
      )}
    </Table>
  )
}

function BeerTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['메뉴', '설명', '도수', '용량', '가격'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell(
              [
                <NameCell key="name" item={item} />,
                item.description,
                abvStr(item.abv),
                item.volume_ml != null ? `${item.volume_ml}ml` : '-',
                fmt(item.price),
              ],
              item,
              isAdmin,
              onItemUpdated,
              onItemDeleted
            )}
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

function WineTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const bySubcat = (sub: string) => limited.filter((i) => i.subcategory === sub)
  const headers = headersWithEdit(['메뉴', '설명', '도수', '1 Glass', '1 Bottle'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        WINE_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <Fragment key={`group-${key}`}>
              <SubHead label={label} colSpan={headers.length} />
              {rows.map((item) => (
                <Row
                  key={item.id}
                  itemId={item.id}
                  dragContext={dragContext}
                  cells={withEditCell(
                    [
                      <NameCell key="name" item={item} />,
                      item.description,
                      abvStr(item.abv),
                      fmt(item.price_glass),
                      fmt(item.price_bottle),
                    ],
                    item,
                    isAdmin,
                    onItemUpdated,
                    onItemDeleted
                  )}
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

function WhiskyTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const bySubcat = (sub: string) => limited.filter((i) => i.subcategory === sub)
  const headers = headersWithEdit(['메뉴', '설명', '도수', '1 Glass', '1 Bottle'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        WHISKY_SUBS.map(({ key, label }) => {
          const rows = bySubcat(key)
          if (rows.length === 0) return null
          return (
            <Fragment key={`group-${key}`}>
              <SubHead label={label} colSpan={headers.length} />
              {rows.map((item) => (
                <Row
                  key={item.id}
                  itemId={item.id}
                  dragContext={dragContext}
                  cells={withEditCell(
                    [
                      <NameCell key="name" item={item} />,
                      item.description,
                      abvStr(item.abv),
                      fmt(item.price_glass),
                      fmt(item.price_bottle),
                    ],
                    item,
                    isAdmin,
                    onItemUpdated,
                    onItemDeleted
                  )}
                />
              ))}
            </Fragment>
          )
        })
      )}
    </Table>
  )
}

function GlassBottleTable({ items, rowLimit, isAdmin, onItemUpdated, onItemDeleted, dragContext }: TableRendererProps) {
  const limited = limitRows(items, rowLimit)
  const headers = headersWithEdit(['메뉴', '설명', '도수', '1 Glass', '1 Bottle'], isAdmin)

  return (
    <Table headers={headers}>
      {limited.length === 0 ? (
        <Empty colSpan={headers.length} />
      ) : (
        limited.map((item) => (
          <Row
            key={item.id}
            itemId={item.id}
            dragContext={dragContext}
            cells={withEditCell(
              [<NameCell key="name" item={item} />, item.description, abvStr(item.abv), fmt(item.price_glass), fmt(item.price_bottle)],
              item,
              isAdmin,
              onItemUpdated,
              onItemDeleted
            )}
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
  isAdmin = false,
  onItemUpdated,
  onItemDeleted,
  dragContext,
}: {
  items: MenuItem[]
  category: MenuCategory
  viewMode: ViewMode
  isAdmin?: boolean
  onItemUpdated?: (updated: MenuItem) => void
  onItemDeleted?: (deletedId: string) => void
  dragContext?: ListDragContext
}) {
  const canUsePhotoView = category === 'event' || category === 'food'
  if (viewMode === 'photo' && canUsePhotoView) {
    return (
      <PhotoGrid
        items={items}
        isAdmin={isAdmin}
        onItemUpdated={onItemUpdated}
        onItemDeleted={onItemDeleted}
        emptyMessage={category === 'event' ? '등록된 이벤트가 없습니다.' : undefined}
      />
    )
  }

  const commonProps: TableRendererProps = { items, isAdmin, onItemUpdated, onItemDeleted, dragContext }

  switch (category) {
    case 'event':
      return <EventTable {...commonProps} />
    case 'food':
      return <FoodTable {...commonProps} />
    case 'non_alcohol':
      return <SimplePriceTable {...commonProps} />
    case 'beverage':
      return <SimplePriceTable {...commonProps} />
    case 'signature':
      return <SignatureTable {...commonProps} />
    case 'cocktail':
      return <CocktailTable {...commonProps} />
    case 'beer':
      return <BeerTable {...commonProps} />
    case 'wine':
      return <WineTable {...commonProps} />
    case 'whisky':
      return <WhiskyTable {...commonProps} />
    case 'shochu':
      return <GlassBottleTable {...commonProps} />
    case 'spirits':
      return <GlassBottleTable {...commonProps} />
    default:
      return null
  }
}
