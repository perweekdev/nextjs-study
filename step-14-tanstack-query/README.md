# Step 14 — 서버 상태 관리 (TanStack Query)

> 📌 이 단계는 **심화 챕터**입니다. step-01 ~ step-12 완주와 `project-kanban` 실습 후 학습을 권장합니다.
> step-06(데이터 패칭), step-08(캐싱), step-10(API Routes), 그리고 step-13(Zustand)을 전제로 합니다.

## 왜 이 단계가 필요한가?

App Router의 서버 컴포넌트는 "페이지를 그릴 때" 데이터를 가져오는 데 강력합니다(step-06).
하지만 **클라이언트에서 데이터를 다시 조회·갱신해야 하는** 상황이 있습니다.

```
서버 컴포넌트 fetch 가 잘 맞는 경우     → 첫 페이지 렌더링, SEO, 정적/ISR 페이지
TanStack Query 가 잘 맞는 경우          → 클라이언트에서 주기적 갱신, 낙관적 업데이트,
                                          무한 스크롤, 포커스 시 자동 리페칭, 실시간성
```

칸반 보드는 **팀 협업 + 실시간 업데이트**가 목표입니다. 다른 사람이 카드를 옮기면 내 화면도 갱신돼야 하고,
내가 카드를 드래그하면 서버 응답을 기다리지 않고 **즉시** 화면에 반영(낙관적 업데이트)돼야 합니다.
이건 서버 컴포넌트의 "한 번 그리고 끝" 모델로는 부족합니다. → TanStack Query가 필요합니다.

---

## 개념 설명

### 서버 상태 vs 클라이언트 상태 (step-13과의 역할 분담)

| 구분 | 도구 | 칸반 예시 |
|------|------|-----------|
| **서버 상태** (DB에 있고, 비동기로 가져오고, 캐싱·동기화 대상) | **TanStack Query** | 카드 목록, 보드 멤버 |
| **클라이언트 UI 상태** (브라우저에만 존재) | **Zustand** (step-13) | 드래그 중인 카드, 모달 |

> 흔한 실수: 서버 데이터를 Zustand에 복사해두고 직접 동기화하려다 지옥을 봅니다.
> 서버 데이터는 TanStack Query에 맡기고, Zustand는 순수 UI 상태만 담당하게 하세요.

---

### Next.js 내장 캐시(step-08)와 무엇이 다른가?

| | Next.js Data Cache (step-08) | TanStack Query |
|---|---|---|
| 위치 | 서버 | **클라이언트(브라우저)** |
| 무효화 | `revalidatePath` / `revalidateTag` | `invalidateQueries` |
| 자동 리페칭 | ❌ | ✅ 포커스/재연결/주기적 |
| 낙관적 업데이트 | 수동 | ✅ 1급 지원 |

둘은 **경쟁이 아니라 보완** 관계입니다. 첫 렌더는 서버에서(빠른 FCP), 이후 클라이언트 상호작용은 TanStack Query로.

---

### 3가지 핵심 API

```tsx
// 1) 조회 — useQuery
const { data, isLoading, error } = useQuery({
  queryKey: ['cards', boardId],          // 캐시 키
  queryFn: () => fetchCards(boardId),    // 실제 패칭 함수
})

// 2) 변경 — useMutation
const mutation = useMutation({
  mutationFn: (newCard) => createCard(newCard),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cards', boardId] }),
})

// 3) 캐시 무효화 — queryClient.invalidateQueries
// 변경 후 관련 쿼리를 "오래됨" 처리 → 자동 재조회
```

- **`queryKey`**: 캐시의 주소. 같은 키는 캐시를 공유하고, 키 일부가 바뀌면(예: `boardId`) 새로 조회합니다.
- **`staleTime`**: 데이터가 "신선하다"고 보는 시간. 이 동안은 재조회하지 않습니다.

---

## 칸반 보드에서 왜 필요한가?

```
카드 이동(드래그 드롭) 흐름:

1. 사용자가 카드를 Done 컬럼으로 드롭
2. [낙관적 업데이트] 화면에 즉시 Done으로 이동 (서버 응답 안 기다림)
3. 서버에 PATCH 요청
4. 성공 → 캐시 확정
   실패 → onError에서 이전 상태로 롤백 + 토스트
5. onSettled → invalidateQueries로 서버 기준 최종 동기화
```

사용자 입장에서 "즉각 반응하는 앱"의 핵심이 바로 이 낙관적 업데이트입니다.

---

## 코드 예제

### 1. Provider 설정 (App Router 필수)

`QueryClientProvider`는 Context를 쓰므로 **`'use client'` 컴포넌트**여야 하고,
`QueryClient`는 `useState`로 **요청/마운트당 1회만** 생성해 요청 간 캐시가 섞이지 않게 합니다.

```tsx
// app/providers.tsx
'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,      // 30초간 재조회 안 함
            refetchOnWindowFocus: true, // 탭 복귀 시 자동 갱신 (협업에 유용)
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
```

```tsx
// app/layout.tsx — 서버 컴포넌트에서 Provider를 children에 씌움 (step-05 패턴)
import Providers from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### 2. API 호출 함수 (step-10 API Routes 연동)

```ts
// lib/api/cards.ts
import type { Card } from '@/types'

export async function fetchCards(boardId: string): Promise<Card[]> {
  const res = await fetch(`/api/boards/${boardId}/cards`)
  if (!res.ok) throw new Error('카드를 불러오지 못했습니다')
  return res.json()
}

export async function moveCard(input: {
  cardId: string
  toColumnId: string
}): Promise<Card> {
  const res = await fetch(`/api/cards/${input.cardId}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toColumnId: input.toColumnId }),
  })
  if (!res.ok) throw new Error('카드 이동에 실패했습니다')
  return res.json()
}
```

### 3. 조회 — useQuery

```tsx
// components/board/CardList.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCards } from '@/lib/api/cards'
import KanbanCard from './KanbanCard'

export default function CardList({
  boardId,
  columnId,
}: {
  boardId: string
  columnId: string
}) {
  const { data: cards, isLoading, error } = useQuery({
    queryKey: ['cards', boardId],
    queryFn: () => fetchCards(boardId),
  })

  if (isLoading) return <p className="text-xs text-gray-400">불러오는 중…</p>
  if (error) return <p className="text-xs text-red-500">{(error as Error).message}</p>

  const columnCards = cards!.filter((c) => c.columnId === columnId)

  return (
    <div className="space-y-2">
      {columnCards.map((card) => (
        <KanbanCard key={card.id} card={card} />
      ))}
    </div>
  )
}
```

### 4. 낙관적 업데이트 — useMutation (칸반의 핵심)

```tsx
// components/board/useMoveCard.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { moveCard } from '@/lib/api/cards'
import type { Card } from '@/types'

export function useMoveCard(boardId: string) {
  const queryClient = useQueryClient()
  const key = ['cards', boardId]

  return useMutation({
    mutationFn: moveCard,

    // 1) 서버 응답 전에 캐시를 미리 바꿔 화면에 즉시 반영
    onMutate: async ({ cardId, toColumnId }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Card[]>(key)

      queryClient.setQueryData<Card[]>(key, (old) =>
        old?.map((c) => (c.id === cardId ? { ...c, columnId: toColumnId } : c))
      )

      return { previous } // 롤백용 컨텍스트
    },

    // 2) 실패하면 이전 상태로 롤백
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },

    // 3) 성공/실패 무관하게 서버 기준으로 최종 동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
```

```tsx
// components/board/KanbanCard.tsx (이동 트리거 발췌)
'use client'

import { useMoveCard } from './useMoveCard'
import type { Card } from '@/types'

export default function KanbanCard({
  card,
  boardId,
}: {
  card: Card
  boardId: string
}) {
  const moveCard = useMoveCard(boardId)

  return (
    <div
      draggable
      onDragEnd={() => moveCard.mutate({ cardId: card.id, toColumnId: 'col-3' })}
      className="bg-white border rounded-lg p-3 shadow-sm"
    >
      {card.title}
    </div>
  )
}
```

### 5. (심화) 서버 프리페치 + Hydration

첫 렌더부터 데이터가 보이게 하려면, 서버 컴포넌트에서 미리 프리페치한 캐시를 클라이언트로 전달(dehydrate)합니다.
서버 렌더링의 빠른 FCP(step-06)와 클라이언트 캐시(TanStack Query)를 모두 얻는 방법입니다.

```tsx
// app/board/[boardId]/page.tsx (Server Component)
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from '@tanstack/react-query'
import { getBoardCards } from '@/lib/data' // 서버에서 직접 DB 조회
import BoardClient from './BoardClient'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const queryClient = new QueryClient()

  // 서버에서 미리 채워둠
  await queryClient.prefetchQuery({
    queryKey: ['cards', boardId],
    queryFn: () => getBoardCards(boardId),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BoardClient boardId={boardId} />
    </HydrationBoundary>
  )
}
```

`BoardClient`(클라이언트) 안에서 동일한 `queryKey: ['cards', boardId]`로 `useQuery`를 호출하면,
**네트워크 요청 없이** 서버가 미리 채운 캐시를 즉시 사용합니다.

---

## 체크리스트

- [ ] "서버 상태"와 "클라이언트 UI 상태"를 구분하고 각각의 도구를 말할 수 있다
- [ ] `QueryClientProvider`를 `'use client'`로 만들어 `layout`에 배치할 수 있다
- [ ] `useQuery`의 `queryKey`가 캐시 주소 역할을 한다는 것을 안다
- [ ] `useMutation` + `invalidateQueries`로 변경 후 갱신을 구현할 수 있다
- [ ] `onMutate`/`onError`/`onSettled`로 낙관적 업데이트와 롤백을 구현할 수 있다
- [ ] Next.js 내장 캐시(step-08)와 TanStack Query 캐시의 차이를 설명할 수 있다
- [ ] (심화) `prefetchQuery` + `HydrationBoundary`로 SSR 프리페치를 할 수 있다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 0. 설치

```bash
npm install @tanstack/react-query
# (선택) 디버깅 도구
npm install @tanstack/react-query-devtools
```

### 1. Provider 설정

- `app/providers.tsx` 생성 (**코드 예제 1번**)
- `app/layout.tsx`에서 `children`을 `<Providers>`로 감싸기
- (선택) `<ReactQueryDevtools initialIsOpen={false} />`를 Providers 안에 추가

### 2. API Route 준비 (step-10 복습)

`app/api/boards/[boardId]/cards/route.ts`에 GET 핸들러를 만들어 `lib/data.ts`의 카드를 반환합니다.
(이동용 PATCH 라우트는 목업으로 성공/실패를 흉내 내도 됩니다.)

> 💡 `types/index.ts`의 `Card`에 `columnId` 필드가 없다면 추가하세요. 클라이언트에서 컬럼별로 필터링하려면 필요합니다.

### 3. 조회 전환

기존 서버 컴포넌트로 그리던 카드 목록을, **코드 예제 3번**의 `CardList`(클라이언트 + `useQuery`)로 교체합니다.

### 4. 낙관적 이동 구현

- `useMoveCard` 훅 생성 (**코드 예제 4번**)
- `KanbanCard`의 `onDragEnd`(step-13에서 만든 드래그)와 연결

### 5. 확인

- 카드를 드롭하면 **즉시** 이동하는지 (낙관적 업데이트)
- 네트워크 탭에서 PATCH를 의도적으로 실패시키면 **이전 위치로 롤백**되는지
- 다른 탭에서 데이터를 바꾼 뒤 이 탭으로 돌아오면 자동 리페칭되는지 (`refetchOnWindowFocus`)
- Devtools에서 `['cards', 'board-1']` 쿼리의 상태(fresh/stale/fetching) 변화 관찰

---

## 마무리 — 전체 그림

```
첫 렌더            서버 컴포넌트 / 프리페치 (step-06, 14 심화)  → 빠른 FCP
클라이언트 데이터   TanStack Query (useQuery/useMutation)        → 갱신·캐싱·낙관적 업데이트
클라이언트 UI 상태  Zustand (step-13)                            → 드래그·모달·필터
서버 변경          Server Actions + revalidate (step-07, 08)    → DB 쓰기·서버 캐시 무효화
```

이 4가지를 역할에 맞게 조합하면 칸반 보드의 "실시간 협업" 요구사항을 자연스럽게 충족할 수 있습니다.
