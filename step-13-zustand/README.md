# Step 13 — 클라이언트 전역 상태 (Zustand)

> 📌 이 단계는 **심화 챕터**입니다. step-01 ~ step-12 (기초 완주)와 `project-kanban` 실습을 마친 뒤 학습하는 것을 권장합니다.
> step-05(서버/클라이언트 컴포넌트)에서 배운 `'use client'` 개념을 전제로 합니다.

## 왜 이 단계가 필요한가?

App Router는 "서버 중심"이라 데이터의 상당 부분을 서버 컴포넌트 + Server Actions(step-07)로 처리합니다.
하지만 **여러 클라이언트 컴포넌트가 동시에 공유해야 하는 순수 UI 상태**는 서버가 모릅니다.

```
서버가 처리하는 상태          → 보드/카드 데이터 (DB, Server Actions)
클라이언트 전역 상태이 필요한 것 → 드래그 중인 카드, 열려있는 모달, 필터 조건
```

칸반 보드에서 이런 상태는 컴포넌트 트리 곳곳에 흩어져 있어, props로 내려보내면 **props drilling**이 심해집니다.
React `Context`로도 가능하지만, 값이 바뀔 때마다 Provider 하위 전체가 리렌더되는 문제가 있습니다.
**Zustand**는 이 문제를 가볍게 해결합니다.

---

## 개념 설명

### React Context 와의 비교

| | React Context | Zustand |
|---|---|---|
| Provider 필요 | ✅ 트리 감싸야 함 | ❌ 불필요 (간단한 경우) |
| 리렌더 범위 | Provider 하위 **전체** | 구독한 **값만** |
| 보일러플레이트 | createContext + Provider + useContext | `create` 한 줄 |
| 사용처 | 자주 안 바뀌는 값(theme, locale) | 자주 바뀌는 상태(드래그, 모달) |

> React 기초 비유: `useState`는 "한 컴포넌트의 상태", Zustand는 "컴포넌트 밖에 존재하는 전역 `useState`"라고 생각하면 됩니다.

---

### 스토어 만들기 — `create`

```ts
import { create } from 'zustand'

type CounterStore = {
  count: number
  increment: () => void
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
```

- `set`으로 상태를 갱신합니다 (React `setState`와 유사하게 부분 업데이트).
- 반환된 `useCounterStore`는 **훅**이므로 클라이언트 컴포넌트 안에서만 호출합니다.

---

### 선택적 구독 — selector

```tsx
// ❌ 스토어 전체 구독 → count든 뭐든 바뀌면 리렌더
const store = useCounterStore()

// ✅ 필요한 값만 구독 → count가 바뀔 때만 리렌더
const count = useCounterStore((s) => s.count)
const increment = useCounterStore((s) => s.increment)
```

selector로 **꼭 필요한 조각만** 구독하는 것이 Zustand 성능의 핵심입니다.

---

### App Router에서의 주의점 ⚠️

1. **스토어를 사용하는 컴포넌트는 반드시 `'use client'`** 여야 합니다 (훅이므로).
2. 모듈 최상단에서 만든 스토어는 **클라이언트 전역 상태 전용**으로 쓰세요.
   서버 데이터의 초기값을 스토어에 넣어야 한다면, 요청마다 새 스토어를 만드는 **Provider 패턴**(아래 코드 예제 참고)을 써야 요청 간 상태가 섞이지 않습니다.
3. 서버에서 이미 잘 처리되는 데이터(보드/카드 목록)는 Zustand로 끌어오지 마세요. **서버 상태는 step-14(TanStack Query)**, 클라이언트 UI 상태는 Zustand로 역할을 나눕니다.

---

## 칸반 보드에서 왜 필요한가?

```
칸반 보드의 클라이언트 전역 상태:

draggingCardId   ← 지금 드래그 중인 카드 (Column, KanbanCard, DragLayer가 공유)
filterAssignee   ← 담당자 필터 (Navbar의 필터 UI ↔ 모든 Column이 공유)
openCardId       ← 열려있는 카드 상세 모달 (KanbanCard ↔ CardModal이 공유)
```

이 값들은 서버에 저장할 필요가 없고(새로고침하면 초기화돼도 됨), 여러 컴포넌트가 동시에 봐야 합니다. → Zustand에 딱 맞습니다.

---

## 코드 예제

### 1. 보드 UI 스토어

```ts
// stores/useBoardUiStore.ts
import { create } from 'zustand'

type BoardUiStore = {
  draggingCardId: string | null
  openCardId: string | null
  filterAssignee: string | null

  startDrag: (cardId: string) => void
  endDrag: () => void
  openCard: (cardId: string) => void
  closeCard: () => void
  setFilter: (assignee: string | null) => void
}

export const useBoardUiStore = create<BoardUiStore>((set) => ({
  draggingCardId: null,
  openCardId: null,
  filterAssignee: null,

  startDrag: (cardId) => set({ draggingCardId: cardId }),
  endDrag: () => set({ draggingCardId: null }),
  openCard: (cardId) => set({ openCardId: cardId }),
  closeCard: () => set({ openCardId: null }),
  setFilter: (assignee) => set({ filterAssignee: assignee }),
}))
```

### 2. 카드 컴포넌트 — 드래그 상태 구독

```tsx
// components/board/KanbanCard.tsx
'use client'

import type { Card } from '@/types'
import { useBoardUiStore } from '@/stores/useBoardUiStore'

export default function KanbanCard({ card }: { card: Card }) {
  // 필요한 값/액션만 선택적으로 구독
  const isDragging = useBoardUiStore((s) => s.draggingCardId === card.id)
  const startDrag = useBoardUiStore((s) => s.startDrag)
  const endDrag = useBoardUiStore((s) => s.endDrag)
  const openCard = useBoardUiStore((s) => s.openCard)

  return (
    <div
      draggable
      onDragStart={() => startDrag(card.id)}
      onDragEnd={endDrag}
      onClick={() => openCard(card.id)}
      className={`bg-white border rounded-lg p-3 shadow-sm cursor-pointer transition ${
        isDragging ? 'opacity-40 ring-2 ring-blue-400' : 'hover:shadow-md'
      }`}
    >
      <p className="text-sm font-medium text-gray-900">{card.title}</p>
      {card.assignee && (
        <span className="text-xs text-gray-400 mt-1 inline-block">
          @{card.assignee}
        </span>
      )}
    </div>
  )
}
```

### 3. 필터 UI — Navbar에서 설정, Column에서 사용

```tsx
// components/layout/AssigneeFilter.tsx
'use client'

import { useBoardUiStore } from '@/stores/useBoardUiStore'

export default function AssigneeFilter({ members }: { members: string[] }) {
  const filter = useBoardUiStore((s) => s.filterAssignee)
  const setFilter = useBoardUiStore((s) => s.setFilter)

  return (
    <select
      value={filter ?? ''}
      onChange={(e) => setFilter(e.target.value || null)}
      className="border rounded px-2 py-1 text-sm"
    >
      <option value="">전체 보기</option>
      {members.map((m) => (
        <option key={m} value={m}>
          @{m}
        </option>
      ))}
    </select>
  )
}
```

```tsx
// components/board/Column.tsx (발췌)
'use client'

import { useBoardUiStore } from '@/stores/useBoardUiStore'
import KanbanCard from './KanbanCard'
import type { Column as ColumnType } from '@/types'

export default function Column({ column }: { column: ColumnType }) {
  const filter = useBoardUiStore((s) => s.filterAssignee)

  const cards = filter
    ? column.cards.filter((c) => c.assignee === filter)
    : column.cards

  return (
    <div className="bg-gray-100 rounded-xl p-3 w-64 flex-shrink-0">
      <h3 className="font-semibold text-sm mb-3">{column.title}</h3>
      <div className="space-y-2">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}
```

### 4. (심화) SSR 초기값이 필요할 때 — Provider 패턴

서버에서 내려준 데이터로 스토어를 **초기화**해야 한다면, 요청마다 스토어를 새로 만들어야 합니다.
모듈 전역 스토어를 쓰면 여러 사용자의 요청이 같은 인스턴스를 공유할 수 있기 때문입니다.

```tsx
// stores/BoardStoreProvider.tsx
'use client'

import { createContext, useContext, useRef } from 'react'
import { createStore, useStore } from 'zustand'

type BoardState = { boardId: string; openCardId: string | null }
type BoardActions = { openCard: (id: string) => void; closeCard: () => void }
type BoardStore = BoardState & BoardActions

const createBoardStore = (init: BoardState) =>
  createStore<BoardStore>((set) => ({
    ...init,
    openCard: (id) => set({ openCardId: id }),
    closeCard: () => set({ openCardId: null }),
  }))

const StoreContext = createContext<ReturnType<typeof createBoardStore> | null>(null)

export function BoardStoreProvider({
  boardId,
  children,
}: {
  boardId: string
  children: React.ReactNode
}) {
  // useRef로 요청(렌더)당 1회만 생성
  const storeRef = useRef<ReturnType<typeof createBoardStore>>(null)
  if (!storeRef.current) {
    storeRef.current = createBoardStore({ boardId, openCardId: null })
  }
  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  )
}

export function useBoardStore<T>(selector: (s: BoardStore) => T): T {
  const store = useContext(StoreContext)
  if (!store) throw new Error('BoardStoreProvider 안에서만 사용하세요')
  return useStore(store, selector)
}
```

```tsx
// app/board/[boardId]/page.tsx (Server Component)
import { BoardStoreProvider } from '@/stores/BoardStoreProvider'
import { getBoard } from '@/lib/data'
import Column from '@/components/board/Column'

export default async function BoardDetailPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const board = await getBoard(boardId)

  return (
    <BoardStoreProvider boardId={board.id}>
      <main className="p-6">
        <h1 className="text-xl font-bold mb-6">{board.title}</h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {board.columns.map((column) => (
            <Column key={column.id} column={column} />
          ))}
        </div>
      </main>
    </BoardStoreProvider>
  )
}
```

> 단순한 클라이언트 전용 상태(드래그, 필터)는 1~3번의 **모듈 전역 스토어**로 충분합니다.
> Provider 패턴은 "서버 데이터로 초기화가 필요할 때"만 쓰세요.

---

## 체크리스트

- [ ] Zustand가 React Context 대비 어떤 장점이 있는지 설명할 수 있다
- [ ] `create`로 스토어를 만들고 `set`으로 상태를 갱신할 수 있다
- [ ] selector로 필요한 값만 구독해 불필요한 리렌더를 막을 수 있다
- [ ] 스토어를 쓰는 컴포넌트에 `'use client'`가 필요한 이유를 안다
- [ ] "서버 상태(데이터)"와 "클라이언트 UI 상태"를 구분할 수 있다
- [ ] SSR 초기값이 필요할 때 Provider 패턴이 왜 필요한지 안다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 0. 설치

```bash
npm install zustand
```

### 1. UI 스토어 생성

`stores/useBoardUiStore.ts` 파일을 위 **코드 예제 1번**대로 생성합니다.

### 2. 카드에 드래그/모달 상태 연결

기존 `components/board/KanbanCard.tsx`(step-05에서 만든 서버 컴포넌트)를
**코드 예제 2번**처럼 `'use client'` 클라이언트 컴포넌트로 전환하고 스토어를 연결합니다.

> ⚠️ `KanbanCard`를 클라이언트로 바꾸면, 이를 import하는 `Column`도 클라이언트가 되어야 합니다.
> step-05에서 배운 "트리 말단에서 `'use client'`" 원칙과의 트레이드오프를 직접 체감해 보세요.

### 3. 담당자 필터 추가

- `components/layout/AssigneeFilter.tsx` 생성 (**코드 예제 3번**)
- `Navbar`에 `<AssigneeFilter members={['민', '랩', '카오']} />` 배치
- `Column`에서 `filterAssignee`로 카드를 거르도록 수정

### 4. 확인

- `http://localhost:3000/board/board-1` 접속
- 카드를 드래그하면 해당 카드만 흐려지는지 (selector 구독 확인)
- Navbar 필터를 바꾸면 모든 컬럼의 카드가 동시에 걸러지는지
- React DevTools Profiler로 **필터 안 걸린 카드는 리렌더되지 않는지** 확인

---

## 다음 단계

클라이언트 UI 상태는 Zustand로 해결했습니다. 그런데 **서버 데이터(카드 목록)를 클라이언트에서 조회·갱신·캐싱**하려면?
→ step-14 [TanStack Query](../step-14-tanstack-query/README.md)에서 다룹니다.
