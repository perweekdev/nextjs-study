import type { Board } from '@/types'

const MOCK_BOARDS = [
  { id: 'board-1', title: '프로젝트 A' },
  { id: 'board-2', title: '프로젝트 B' },
]

const MOCK_BOARD_DETAIL: Board = {
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
    { id: 'col-2', title: 'In Progress', cards: [{ id: 'card-3', title: 'Navbar 컴포넌트 구현' }] },
    { id: 'col-3', title: 'Done', cards: [{ id: 'card-4', title: '프로젝트 세팅' }] },
  ],
}

export async function getBoards() {
  return MOCK_BOARDS
}

export async function getBoard(boardId: string): Promise<Board> {
  const board = [MOCK_BOARD_DETAIL].find((b) => b.id === boardId)
  if (!board) throw new Error('보드를 찾을 수 없습니다')
  return board
}