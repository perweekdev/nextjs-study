import Column from '@/components/board/Column'
import type { Board } from '@/types'

// Step 06에서 async 함수로 교체 예정
const MOCK_BOARD: Board = {
  id: 'board-1',
  title: '프로젝트 A',
  columns: [
    {
      id: 'col-1',
      title: 'Todo',
      cards: [
        { id: 'card-1', title: '로그인 페이지 디자인' },
        { id: 'card-2', title: 'DB 스키마 설계', description: 'Prisma 사용' },
      ],
    },
    {
      id: 'col-2',
      title: 'In Progress',
      cards: [{ id: 'card-3', title: 'Navbar 컴포넌트 구현' }],
    },
    {
      id: 'col-3',
      title: 'Done',
      cards: [{ id: 'card-4', title: '프로젝트 세팅' }],
    },
  ],
}

type Props = {
  params: { boardId: string }
}

export default function BoardDetailPage({ params }: Props) {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-6">{MOCK_BOARD.title}</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {MOCK_BOARD.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </main>
  )
}