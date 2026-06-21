import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">KanbanApp</h1>
      <p className="text-gray-500">팀 협업을 위한 칸반 보드</p>
      <Link
        href="/board"
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
      >
        시작하기
      </Link>
    </main>
  )
}
