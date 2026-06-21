import type { Card } from '@/types'

type Props = {
  card: Card
}

export default function KanbanCard({ card }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer">
      <p className="text-sm font-medium text-gray-900">{card.title}</p>
      {card.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{card.description}</p>
      )}
    </div>
  )
}