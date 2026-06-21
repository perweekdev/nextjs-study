export default function BoardLoading() {
  return (
    <main className="p-6">
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-64 flex-shrink-0">
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-3" />
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-16 bg-gray-100 rounded-lg animate-pulse mb-2" />
            ))}
          </div>
        ))}
      </div>
    </main>
  )
}