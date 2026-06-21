# Step 02 — 프로젝트 구조

## 개념 설명

### 전체 폴더 구조

```
my-app/
├── app/                    ← App Router 루트 (핵심)
│   ├── layout.tsx          ← 전체 공통 레이아웃
│   ├── page.tsx            ← "/" 페이지
│   ├── globals.css         ← 전역 스타일
│   ├── favicon.ico
│   └── (feature)/          ← 라우트 그룹 (URL에 영향 없음)
│       └── page.tsx
├── public/                 ← 정적 파일 (이미지, 폰트 등)
│   └── images/
├── components/             ← 공유 컴포넌트 (컨벤션, 필수 아님)
├── lib/                    ← 유틸 함수, DB 클라이언트 등
├── types/                  ← TypeScript 타입 정의
├── next.config.js          ← Next.js 설정
├── tailwind.config.ts      ← Tailwind 설정
├── tsconfig.json           ← TypeScript 설정
└── package.json
```

---

### app/ 디렉토리의 특수 파일

App Router는 파일 이름으로 역할을 구분합니다.

| 파일 | 역할 |
|------|------|
| `page.tsx` | 해당 경로의 UI (없으면 그 경로는 존재하지 않음) |
| `layout.tsx` | 자식 페이지를 감싸는 레이아웃 (언마운트 없이 유지) |
| `loading.tsx` | 페이지 로딩 중 보여줄 UI (Suspense 자동 적용) |
| `error.tsx` | 에러 발생 시 보여줄 UI (Error Boundary 자동 적용) |
| `not-found.tsx` | 404 페이지 |
| `route.ts` | API 엔드포인트 (Step 10에서 다룸) |
| `middleware.ts` | 요청 가로채기 — app/ 바깥 루트에 위치 |

---

### 라우트 그룹 `(folder)`

소괄호로 묶인 폴더는 **URL 경로에 포함되지 않습니다**.
레이아웃을 분리하거나 코드를 그룹핑할 때 사용합니다.

```
app/
├── (auth)/
│   ├── login/page.tsx      → /login
│   └── register/page.tsx   → /register
└── (dashboard)/
    ├── layout.tsx          ← 대시보드 전용 레이아웃
    └── board/page.tsx      → /board
```

---

### `@` 경로 별칭

`tsconfig.json`에 설정하면 상대경로 대신 `@/`로 임포트할 수 있습니다.

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

```tsx
// ❌ 상대경로 (depth가 깊어질수록 복잡)
import Button from '../../../components/Button'

// ✅ 절대경로 별칭
import Button from '@/components/Button'
```

`create-next-app`으로 생성하면 기본 설정되어 있습니다.

---

## 칸반 보드에서 왜 필요한가?

칸반 보드의 폴더 구조를 미리 설계해두면 파일이 늘어나도 혼란이 없습니다.

```
app/
├── layout.tsx                  ← 네비게이션 바 포함 전체 레이아웃
├── page.tsx                    ← 홈 (보드 목록)
├── (auth)/
│   ├── login/page.tsx          ← /login
│   └── register/page.tsx       ← /register
└── board/
    ├── page.tsx                ← /board (보드 목록)
    ├── [boardId]/
    │   ├── page.tsx            ← /board/123 (칸반 보드 상세)
    │   ├── loading.tsx         ← 보드 로딩 스피너
    │   └── error.tsx           ← 보드 에러 처리
    └── new/
        └── page.tsx            ← /board/new (보드 생성)

components/
├── board/
│   ├── BoardCard.tsx
│   ├── Column.tsx
│   └── KanbanCard.tsx
├── ui/
│   ├── Button.tsx
│   └── Modal.tsx
└── layout/
    └── Navbar.tsx

lib/
├── db.ts                       ← DB 연결
└── actions/
    ├── board.ts                ← 보드 Server Actions
    └── card.ts                 ← 카드 Server Actions
```

---

## 코드 예제

### 1. 기본 page.tsx

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">내 보드 목록</h1>
    </main>
  )
}
```

### 2. 공통 layout.tsx

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '칸반 보드',
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
```

### 3. 컴포넌트 분리 예시

```tsx
// components/board/BoardCard.tsx
type Props = {
  title: string
  cardCount: number
}

export default function BoardCard({ title, cardCount }: Props) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-gray-500">{cardCount}개의 카드</p>
    </div>
  )
}
```

```tsx
// app/page.tsx
import BoardCard from '@/components/board/BoardCard'

export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-6">내 보드 목록</h1>
      <div className="grid grid-cols-3 gap-4">
        <BoardCard title="프로젝트 A" cardCount={12} />
        <BoardCard title="프로젝트 B" cardCount={5} />
      </div>
    </main>
  )
}
```

---

## 체크리스트

- [ ] `app/` 디렉토리의 특수 파일 이름 6개를 안다
- [ ] 라우트 그룹 `(folder)` 의 용도를 안다
- [ ] `@/` 경로 별칭을 사용할 수 있다
- [ ] 칸반 보드용 폴더 구조를 직접 그려봤다
- [ ] `components/`, `lib/`, `types/` 폴더를 프로젝트에 만들었다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 폴더 생성

```bash
mkdir -p components/board components/ui components/layout
mkdir -p lib/actions
mkdir -p types
```

### 2. 타입 정의 파일 생성

프로젝트 전체에서 사용할 TypeScript 타입을 미리 정의합니다.

```ts
/* types/index.ts */
export type Card = {
  id: string
  title: string
  description?: string
  assignee?: string
}

export type Column = {
  id: string
  title: string
  cards: Card[]
}

export type Board = {
  id: string
  title: string
  columns: Column[]
}
```

### 3. Navbar 컴포넌트 생성

```tsx
/* components/layout/Navbar.tsx */
import Link from 'next/link'

export default function Navbar() {
  return (
    <header className="h-14 border-b px-6 flex items-center justify-between bg-white shadow-sm">
      <Link href="/" className="font-bold text-lg text-gray-900">
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
```

### 4. 루트 레이아웃에 Navbar 추가

```tsx
/* app/layout.tsx */
import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: 'KanbanApp',
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
```

### 5. 확인

`http://localhost:3000` → 상단에 Navbar가 보이면 완료
