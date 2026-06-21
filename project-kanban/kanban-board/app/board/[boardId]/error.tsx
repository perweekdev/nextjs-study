'use client'

export default function BoardError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="p-6 text-center">
      <p className="text-red-500 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm"
      >
        다시 시도
      </button>
    </main>
  )
}