# Step 03 — 라우팅 기초

## 개념 설명

### 파일 기반 라우팅

Next.js App Router는 `app/` 폴더 안의 **파일 구조가 곧 URL**입니다.

```
app/
├── page.tsx              → /
├── about/
│   └── page.tsx          → /about
└── board/
    ├── page.tsx          → /board
    └── new/
        └── page.tsx      → /board/new
```

`page.tsx` 파일이 있어야만 해당 경로가 외부에 노출됩니다.

---

### 동적 라우트 `[param]`

대괄호로 감싼 폴더는 동적 세그먼트입니다.

```
app/
└── board/
    └── [boardId]/
        └── page.tsx      → /board/abc, /board/123, ...
```

```tsx
// app/board/[boardId]/page.tsx
type Props = {
  params: { boardId: string }
}

export default function BoardPage({ params }: Props) {
  return <h1>보드 ID: {params.boardId}</h1>
}
```

---

### Catch-all 라우트 `[...slug]`

여러 세그먼트를 하나의 파일로 받을 때 사용합니다.

```
app/
└── docs/
    └── [...slug]/
        └── page.tsx      → /docs/a, /docs/a/b, /docs/a/b/c, ...
```

```tsx
// app/docs/[...slug]/page.tsx
type Props = {
  params: { slug: string[] }
}

export default function DocsPage({ params }: Props) {
  return <p>경로: {params.slug.join(' / ')}</p>
}
```

Optional catch-all `[[...slug]]`은 `/docs` 자체도 매칭합니다.

---

### Link 컴포넌트로 이동

```tsx
import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <Link href="/">홈</Link>
      <Link href="/board">보드 목록</Link>
      <Link href="/board/new">새 보드</Link>
    </nav>
  )
}
```

`<a>` 태그 대신 `<Link>`를 쓰면 페이지 전체 새로고침 없이 클라이언트 사이드 이동이 됩니다.

---

### 프로그래밍 방식 이동 (useRouter)

```tsx
'use client'

import { useRouter } from 'next/navigation'

export default function CreateButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.push('/board/new')}>
      새 보드 만들기
    </button>
  )
}
```

> `next/navigation`에서 import합니다. (`next/router` 아님)

---

## 칸반 보드에서 왜 필요한가?

칸반 보드의 라우트 설계:

```
/                           → 홈 (보드 목록)
/board                      → 전체 보드 목록
/board/[boardId]            → 특정 보드 (칸반 뷰)
/board/[boardId]/card/[cardId]  → 카드 상세/수정
/board/new                  → 새 보드 생성
```

`[boardId]`를 동적 라우트로 처리하면 보드가 몇 개가 생겨도 파일 하나로 대응할 수 있습니다.

---

## 코드 예제

### 보드 목록 페이지 → 보드 상세로 이동

```tsx
// app/board/page.tsx
import Link from 'next/link'

const boards = [
  { id: 'board-1', title: '프로젝트 A' },
  { id: 'board-2', title: '프로젝트 B' },
]

export default function BoardListPage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">보드 목록</h1>
      <ul className="space-y-3">
        {boards.map((board) => (
          <li key={board.id}>
            <Link
              href={`/board/${board.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              {board.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

### 보드 상세 페이지

```tsx
// app/board/[boardId]/page.tsx
type Props = {
  params: { boardId: string }
}

export default function BoardDetailPage({ params }: Props) {
  const { boardId } = params

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">보드: {boardId}</h1>
      {/* 칸반 컬럼들이 여기에 들어옵니다 */}
    </main>
  )
}
```

---

## 체크리스트

- [ ] 파일 구조가 URL이 된다는 규칙을 이해했다
- [ ] 동적 라우트 `[param]` 을 만들고 `params`를 받을 수 있다
- [ ] `<Link>` 와 `useRouter().push()` 의 차이를 안다
- [ ] `/board/[boardId]` 경로를 실제로 만들어봤다
- [ ] 보드 목록에서 상세 페이지로 이동이 되는지 확인했다
