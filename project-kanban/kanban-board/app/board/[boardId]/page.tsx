import Column from '@/components/board/Column'
import { getBoard } from '@/lib/data'

type Props = {
  params: Promise<{ boardId: string }>
}

export default async function BoardDetailPage({ params }: Props) {
  const { boardId } = await params
  const board = await getBoard(boardId)

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-6">{board.title}</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </main>
  )
}