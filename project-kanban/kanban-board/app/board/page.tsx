import Link from 'next/link'
import { getBoards } from '@/lib/data'

export default async function BoardListPage() {
  const boards = await getBoards()

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
        {boards.map((board) => (
          <Link
            key={board.id}
            href={`/board/${board.id}`}
            className="block border rounded-xl p-5 bg-white hover:shadow-md transition"
          >
            <h2 className="font-semibold">{board.title}</h2>
          </Link>
        ))}
      </div>
    </main>
  )
}
