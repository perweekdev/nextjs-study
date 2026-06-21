import Link from 'next/link'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: '내 보드',
}

// Step 06에서 DB 연동으로 교체 예정
const MOCK_BOARDS = [
  { id: 'board-1', title: '프로젝트 A' },
  { id: 'board-2', title: '프로젝트 B' },
]

export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* 사이드바 */}
      <aside className="w-56 border-r bg-white p-4 overflow-y-auto flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase">내 보드</p>
          <Link href="/board/new" className="text-blue-500 text-lg leading-none">
            +
          </Link>
        </div>
        <ul className="space-y-1">
          {MOCK_BOARDS.map((board) => (
            <li key={board.id}>
              <Link
                href={`/board/${board.id}`}
                className="block px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700"
              >
                {board.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* 메인 콘텐츠 */}
      <section className="flex-1 overflow-auto">{children}</section>
    </div>
  )
}