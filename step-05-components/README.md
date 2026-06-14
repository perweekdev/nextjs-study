# Step 05 — 서버 vs 클라이언트 컴포넌트

## 개념 설명

### 기본값: Server Component

App Router에서 모든 컴포넌트는 기본적으로 **Server Component**입니다.
서버에서만 실행되므로 브라우저 API(`window`, `document`)나 React 훅(`useState`, `useEffect`)을 쓸 수 없습니다.

대신 이런 장점이 있습니다:
- DB, 파일시스템에 직접 접근 가능
- API 키 등 민감한 정보가 클라이언트에 노출되지 않음
- JS 번들 크기를 줄여 초기 로딩 속도 개선

---

### Client Component: `'use client'`

파일 최상단에 `'use client'`를 선언하면 클라이언트 컴포넌트가 됩니다.

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

클라이언트 컴포넌트가 필요한 경우:
- `useState`, `useEffect`, `useRef` 등 React 훅 사용
- `onClick`, `onChange` 등 이벤트 핸들러 사용
- 브라우저 API (`localStorage`, `window`, `navigator`) 사용
- 드래그앤드롭 등 인터랙티브 UI

---

### 핵심 규칙

| 규칙 | 설명 |
|------|------|
| Server → Client ✅ | 서버 컴포넌트가 클라이언트 컴포넌트를 import할 수 있다 |
| Client → Server ❌ | 클라이언트 컴포넌트 안에서 서버 컴포넌트를 직접 import하면 그 컴포넌트도 클라이언트가 됨 |
| Client → Server (children) ✅ | `children`으로 서버 컴포넌트를 전달하는 건 가능 |

---

### 컴포넌트 경계 설계 전략

인터랙티브한 부분만 클라이언트로 분리하고, 나머지는 서버로 유지합니다.

```
BoardPage (Server)          ← DB 조회, SEO
  └── KanbanBoard (Server)  ← 컬럼 렌더링
        ├── Column (Server) ← 카드 목록
        └── DragLayer (Client) ← 드래그앤드롭만 분리
```

가능한 한 **트리의 말단(leaf)**에서 `'use client'`를 선언하는 게 좋습니다.

---

## 칸반 보드에서 왜 필요한가?

칸반 보드에서 서버/클라이언트 경계를 잘못 나누면 불필요한 JS가 클라이언트로 내려가 성능이 떨어집니다.

```
BoardPage          (Server)  ← /board/[boardId] 데이터 패칭
  ColumnList       (Server)  ← 컬럼 목록 렌더링
    Column         (Server)  ← 개별 컬럼
      CardList     (Server)  ← 카드 목록
        Card       (Server)  ← 카드 텍스트, 메타데이터
  DragProvider   (Client)    ← 드래그앤드롭 컨텍스트
  AddCardButton  (Client)    ← 카드 추가 버튼 (onClick)
  CardModal      (Client)    ← 카드 수정 모달 (useState)
```

---

## 코드 예제

### Server Component — 보드 데이터 로딩

```tsx
// app/board/[boardId]/page.tsx  (Server Component, 기본값)
import DragProvider from '@/components/board/DragProvider'
import ColumnList from '@/components/board/ColumnList'

async function getBoard(boardId: string) {
  // 실제로는 DB 조회
  return {
    id: boardId,
    title: '프로젝트 A',
    columns: [
      { id: 'col-1', title: 'Todo', cards: [] },
      { id: 'col-2', title: 'In Progress', cards: [] },
      { id: 'col-3', title: 'Done', cards: [] },
    ],
  }
}

type Props = { params: { boardId: string } }

export default async function BoardPage({ params }: Props) {
  const board = await getBoard(params.boardId)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-6">{board.title}</h1>
      <DragProvider>
        <ColumnList columns={board.columns} />
      </DragProvider>
    </div>
  )
}
```

### Client Component — 드래그 컨텍스트

```tsx
// components/board/DragProvider.tsx
'use client'

import { useState } from 'react'

export default function DragProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [dragging, setDragging] = useState<string | null>(null)

  return (
    <div
      onDragStart={(e) => setDragging(e.currentTarget.id)}
      onDragEnd={() => setDragging(null)}
    >
      {children}
    </div>
  )
}
```

### Client Component — 카드 추가 버튼

```tsx
// components/board/AddCardButton.tsx
'use client'

import { useState } from 'react'

export default function AddCardButton({ columnId }: { columnId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full text-sm text-gray-500 hover:bg-gray-100 p-2 rounded"
      >
        + 카드 추가
      </button>
      {open && (
        <div className="border rounded p-3 mt-2">
          <input
            className="border w-full p-1 text-sm rounded"
            placeholder="카드 제목 입력..."
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button className="text-sm bg-blue-500 text-white px-3 py-1 rounded">
              추가
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  )
}
```

---

## 체크리스트

- [ ] Server Component와 Client Component의 차이를 설명할 수 있다
- [ ] `'use client'`를 언제 써야 하는지 안다
- [ ] Client 안에서 Server를 import하면 안 되는 이유를 안다
- [ ] `children` props로 서버 컴포넌트를 클라이언트에 전달할 수 있다
- [ ] 칸반 보드에서 클라이언트 컴포넌트 경계를 직접 설계해봤다
