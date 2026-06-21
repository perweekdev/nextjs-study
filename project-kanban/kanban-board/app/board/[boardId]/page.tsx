type Props = {
  params: { boardId: string }
}

export default function BoardDetailPage({ params }: Props) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">보드: {params.boardId}</h1>
      <p className="text-gray-400">Step 05에서 칸반 뷰를 구현합니다.</p>
    </main>
  )
}