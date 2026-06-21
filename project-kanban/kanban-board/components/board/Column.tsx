import type { Column as ColumnType } from '@/types'
import KanbanCard from './KanbanCard'
import AddCardButton from './AddCardButton'

type Props = {
  column: ColumnType
}

export default function Column({ column }: Props) {
  return (
    <div className="bg-gray-100 rounded-xl p-3 w-64 flex-shrink-0">
      {/* 컬럼 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
          {column.cards.length}
        </span>
      </div>

      {/* 카드 목록 */}
      <div className="space-y-2 min-h-[4rem]">
        {column.cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>

      {/* 카드 추가 버튼 (Client Component) */}
      <AddCardButton columnId={column.id} />
    </div>
  )
}