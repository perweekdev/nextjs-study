import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="h-14 border-b px-6 flex items-center justify-between bg-white">
      <Link href="/" className="font-bold text-lg">
        KanbanApp
      </Link>
      <nav className="flex gap-4 text-sm">
        <Link href="/board" className="text-gray-600 hover:text-black">
          내 보드
        </Link>
      </nav>
    </header>
  )
}