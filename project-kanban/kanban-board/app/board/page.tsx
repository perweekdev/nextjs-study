import Link from 'next/link'

// Step 06에서 DB 연동으로 교체 예정 — 지금은 목업 데이터 사용
const MOCK_BOARDS = [
  { id: 'board-1', title: '프로젝트 A' },
  { id: 'board-2', title: '프로젝트 B' },
]

export default function BoardListPage() {
  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">내 보드</h1>
        <Link
          href="/board/new"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
        >
          + 새 보드
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_BOARDS.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            className="block border rounded-xl p-5 hover:shadow-md transition"
          >
            <h2 className="font-semibold">{board.title}</h2>
          </Link>
        ))}
      </div>
    </main>
  )
}