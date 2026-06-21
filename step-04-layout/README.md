# Step 04 — 레이아웃 & 템플릿

## 개념 설명

### layout.tsx

`layout.tsx`는 해당 경로와 하위 경로 모두에 적용되는 **영구 UI 껍데기**입니다.
페이지가 바뀌어도 layout은 **언마운트되지 않고 유지**됩니다. (상태, 스크롤 위치 보존)

```
app/
├── layout.tsx          ← 루트 레이아웃 (필수, 모든 페이지 적용)
├── page.tsx
└── board/
    ├── layout.tsx      ← board 하위에만 적용되는 레이아웃
    ├── page.tsx
    └── [boardId]/
        └── page.tsx
```

루트 `layout.tsx`는 반드시 `<html>`, `<body>` 태그를 포함해야 합니다.

---

### 중첩 레이아웃

레이아웃은 계층적으로 중첩됩니다.

```
루트 layout.tsx       ← 네비게이션 바
  └── board/layout.tsx  ← 사이드바 (보드 목록)
        └── board/[boardId]/page.tsx  ← 칸반 뷰
```

각 레이아웃은 `children`을 받아 렌더링합니다:

```tsx
// app/board/layout.tsx
export default function BoardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <aside className="w-60 border-r p-4">
        {/* 보드 사이드바 */}
      </aside>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
```

---

### template.tsx vs layout.tsx

| 구분 | layout.tsx | template.tsx |
|------|-----------|--------------|
| 페이지 전환 시 | 언마운트 안 됨 (유지) | 매번 새로 마운트 |
| 상태 보존 | ✅ 유지 | ❌ 초기화 |
| 애니메이션 | 매 전환마다 안 됨 | 매 전환마다 가능 |
| 사용 빈도 | 자주 사용 | 드물게 사용 |

페이지 전환 시 페이드인 애니메이션을 적용하고 싶을 때 `template.tsx`를 씁니다.

---

### metadata 설정

`layout.tsx` 또는 `page.tsx`에서 `metadata`를 export하면 `<head>` 태그가 자동 생성됩니다.

```tsx
// app/board/[boardId]/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '칸반 보드',
  description: '팀 협업 보드',
}
```

동적 metadata가 필요하면 `generateMetadata` 함수를 씁니다:

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // 실제로는 DB에서 조회
  const board = await getBoard(params.boardId)
  return {
    title: board.title,
  }
}
```

---

## 칸반 보드에서 왜 필요한가?

칸반 보드는 세 겹의 레이아웃이 필요합니다:

```
루트 layout.tsx
  → 상단 GNB (로고, 유저 아바타)

board/layout.tsx
  → 좌측 사이드바 (내 보드 목록, 팀 멤버)

board/[boardId]/page.tsx
  → 칸반 컬럼 + 카드 드래그앤드롭 영역
```

사이드바는 보드 페이지들 사이에서 이동해도 사라지지 않아야 하므로 `layout.tsx`로 구현합니다.

---

## 코드 예제

### 루트 레이아웃

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: { template: '%s | KanbanApp', default: 'KanbanApp' },
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <header className="h-14 border-b px-6 flex items-center justify-between">
          <span className="font-bold text-lg">KanbanApp</span>
          <button className="text-sm">로그아웃</button>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### 보드 전용 중첩 레이아웃

```tsx
// app/board/layout.tsx
import Link from 'next/link'

const myBoards = [
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
      <aside className="w-56 border-r p-4 overflow-y-auto">
        <p className="text-xs font-semibold text-gray-400 mb-3">내 보드</p>
        <ul className="space-y-1">
          {myBoards.map((board) => (
            <li key={board.id}>
              <Link
                href={`/board/${board.id}`}
                className="block px-3 py-2 rounded hover:bg-gray-100 text-sm"
              >
                {board.title}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex-1 overflow-auto">{children}</section>
    </div>
  )
}
```

---

## 체크리스트

- [ ] 루트 `layout.tsx`에 `<html>`, `<body>`가 필요한 이유를 안다
- [ ] 중첩 레이아웃이 어떻게 합쳐지는지 이해했다
- [ ] `layout.tsx`와 `template.tsx`의 차이를 안다
- [ ] `metadata` export로 페이지 제목을 설정했다
- [ ] 보드 전용 사이드바를 `board/layout.tsx`로 구현해봤다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 루트 레이아웃 — metadata 템플릿 추가

```tsx
/* app/layout.tsx */
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: {
    template: '%s | KanbanApp',  // 각 페이지 제목 뒤에 자동으로 붙음
    default: 'KanbanApp',
  },
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  )
}
```

### 2. 보드 전용 레이아웃 생성 (사이드바 포함)

```tsx
/* app/board/layout.tsx */
import Link from 'next/link'
import type { Metadata } from 'next'

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
```

### 3. 확인

- `http://localhost:3000/board` → 좌측 사이드바 + 보드 목록
- 사이드바에서 보드 클릭 → 사이드바 유지된 채 콘텐츠만 전환되는지 확인
- 브라우저 탭 제목이 `내 보드 | KanbanApp` 으로 표시되는지 확인
