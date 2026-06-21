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

type Props = { params: Promise<{ boardId: string }> }

export default async function BoardPage({ params }: Props) {
  const { boardId } = await params
  // Promise.all로 병렬 패칭 — 순차 대비 2배 빠름
  const [board, members] = await Promise.all([
    getBoard(boardId),
    getMembers(boardId),
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

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 목업 데이터 함수 생성

실제 DB 연동 전까지 사용할 async 함수입니다. 나중에 이 함수만 교체하면 됩니다.

```ts
/* lib/data.ts */
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
    {
      id: 'col-2',
      title: 'In Progress',
      cards: [{ id: 'card-3', title: 'Navbar 컴포넌트 구현' }],
    },
    {
      id: 'col-3',
      title: 'Done',
      cards: [{ id: 'card-4', title: '프로젝트 세팅' }],
    },
  ],
}

// 보드 목록 조회
export async function getBoards() {
  // 실제 DB: return await prisma.board.findMany()
  await new Promise((r) => setTimeout(r, 500)) // 로딩 UI 확인용 딜레이
  return MOCK_BOARDS
}

// 보드 상세 조회
export async function getBoard(boardId: string): Promise<Board> {
  await new Promise((r) => setTimeout(r, 800))
  if (boardId !== 'board-1') throw new Error('보드를 찾을 수 없습니다')
  return MOCK_BOARD_DETAIL
}
```

### 2. 보드 목록 페이지 — async로 전환

```tsx
/* app/board/page.tsx */
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
```

### 3. 보드 상세 페이지 — async로 전환

```tsx
/* app/board/[boardId]/page.tsx */
import Column from '@/components/board/Column'
import { getBoard } from '@/lib/data'

type Props = {
  params: Promise<{ boardId: string }>
}

export default async function BoardDetailPage({ params }: Props) {
  const { boardId } = await params
  const board = await getBoard(boardId)

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-6">{board.title}</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <Column key={column.id} column={column} />
        ))}
      </div>
    </main>
  )
}
```

### 4. 로딩 UI 생성

```tsx
/* app/board/[boardId]/loading.tsx */
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
```

### 5. 에러 UI 생성

```tsx
/* app/board/[boardId]/error.tsx */
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
```

### 6. 확인

- `http://localhost:3000/board` → 500ms 후 보드 목록 표시
- `http://localhost:3000/board/board-1` → 스켈레톤 후 칸반 뷰 표시
- `http://localhost:3000/board/board-999` → 에러 UI + "다시 시도" 버튼 표시
