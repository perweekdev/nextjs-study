# Step 06 — 데이터 패칭

## 개념 설명

### Server Component에서 async/await

App Router의 가장 큰 변화입니다. 서버 컴포넌트는 `async` 함수로 만들 수 있어, 컴포넌트 안에서 직접 데이터를 가져올 수 있습니다.

```tsx
// 이게 전부입니다 — useEffect, useState 필요 없음
export default async function BoardPage() {
  const data = await fetch('https://api.example.com/boards').then(r => r.json())

  return <div>{data.title}</div>
}
```

---

### loading.tsx — 자동 로딩 UI

같은 폴더에 `loading.tsx`를 두면, 데이터를 기다리는 동안 자동으로 표시됩니다.
React의 `Suspense`를 Next.js가 자동으로 적용해줍니다.

```
app/board/[boardId]/
├── page.tsx        ← async 데이터 패칭
└── loading.tsx     ← 로딩 중 표시될 UI
```

```tsx
// app/board/[boardId]/loading.tsx
export default function BoardLoading() {
  return (
    <div className="p-6 flex gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-64 h-96 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
```

---

### error.tsx — 자동 에러 처리

같은 폴더에 `error.tsx`를 두면 에러 발생 시 자동으로 표시됩니다.
반드시 `'use client'`여야 합니다.

```tsx
// app/board/[boardId]/error.tsx
'use client'

export default function BoardError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="p-6 text-center">
      <p className="text-red-500 mb-4">보드를 불러오지 못했습니다: {error.message}</p>
      <button
        onClick={reset}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        다시 시도
      </button>
    </div>
  )
}
```

---

### Suspense로 부분 로딩

`loading.tsx`는 페이지 전체에 적용되지만, `<Suspense>`를 직접 쓰면 **컴포넌트 단위**로 로딩을 나눌 수 있습니다.

```tsx
import { Suspense } from 'react'
import CardList from '@/components/board/CardList'
import CardListSkeleton from '@/components/board/CardListSkeleton'

export default function BoardPage() {
  return (
    <div className="flex gap-4">
      <Suspense fallback={<CardListSkeleton />}>
        <CardList columnId="col-1" />
      </Suspense>
      <Suspense fallback={<CardListSkeleton />}>
        <CardList columnId="col-2" />
      </Suspense>
    </div>
  )
}
```

각 컬럼이 독립적으로 로딩되어 하나가 느려도 다른 컬럼은 먼저 표시됩니다.

---

## 칸반 보드에서 왜 필요한가?

```
보드 상세 페이지 로딩 흐름:

1. 사용자가 /board/123 접근
2. loading.tsx → 스켈레톤 UI 즉시 표시
3. BoardPage (async) → DB에서 보드 정보 조회
4. 각 Column (async) → 카드 목록 조회 (병렬)
5. 에러 시 error.tsx → "다시 시도" 버튼 표시
```

로딩/에러 처리를 파일 하나로 선언할 수 있어 보일러플레이트가 크게 줄어듭니다.

---

## 코드 예제

### 병렬 데이터 패칭

여러 데이터를 순차가 아닌 병렬로 가져와 속도를 높입니다.

```tsx
// app/board/[boardId]/page.tsx
async function getBoard(boardId: string) {
  const res = await fetch(`/api/boards/${boardId}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('보드를 찾을 수 없습니다')
  return res.json()
}

async function getMembers(boardId: string) {
  const res = await fetch(`/api/boards/${boardId}/members`)
  return res.json()
}

type Props = { params: { boardId: string } }

export default async function BoardPage({ params }: Props) {
  // Promise.all로 병렬 패칭 — 순차 대비 2배 빠름
  const [board, members] = await Promise.all([
    getBoard(params.boardId),
    getMembers(params.boardId),
  ])

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">{board.title}</h1>
      <p className="text-sm text-gray-500">멤버 {members.length}명</p>
    </div>
  )
}
```

### 스켈레톤 로딩 UI

```tsx
// app/board/[boardId]/loading.tsx
export default function BoardLoading() {
  return (
    <div className="p-6">
      {/* 헤더 스켈레톤 */}
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6" />
      {/* 컬럼 스켈레톤 */}
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-64 flex-shrink-0">
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-3" />
            {[1, 2, 3].map((j) => (
              <div
                key={j}
                className="h-20 bg-gray-100 rounded-lg animate-pulse mb-2"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 체크리스트

- [ ] Server Component에서 `async/await`로 데이터를 가져올 수 있다
- [ ] `loading.tsx`가 Suspense를 자동으로 적용해준다는 것을 안다
- [ ] `error.tsx`에 `'use client'`가 필요한 이유를 안다
- [ ] `Promise.all`로 병렬 패칭을 구현할 수 있다
- [ ] 스켈레톤 로딩 UI를 만들어봤다
