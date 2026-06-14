# Step 08 — 캐싱 전략

## 개념 설명

### Next.js의 4가지 캐시 레이어

Next.js는 성능 최적화를 위해 여러 단계에서 캐시를 적용합니다.

| 캐시 레이어 | 대상 | 위치 | 지속 기간 |
|------------|------|------|-----------|
| Request Memoization | `fetch()` 중복 제거 | 서버 메모리 | 단일 요청 |
| Data Cache | `fetch()` 결과 | 서버 파일시스템 | 영구 (수동 무효화) |
| Full Route Cache | 렌더링된 HTML | 서버 | 재빌드까지 |
| Router Cache | RSC Payload | 클라이언트 메모리 | 세션 동안 |

---

### fetch() 캐시 옵션

```tsx
// 1. 기본값 — 영구 캐시 (SSG와 동일)
fetch('https://api.example.com/data')

// 2. force-cache — 명시적 영구 캐시
fetch('https://api.example.com/data', { cache: 'force-cache' })

// 3. no-store — 캐시 안 함, 매 요청마다 새로 가져옴 (SSR과 동일)
fetch('https://api.example.com/data', { cache: 'no-store' })

// 4. revalidate — N초마다 재검증 (ISR과 동일)
fetch('https://api.example.com/data', { next: { revalidate: 60 } })
```

---

### 페이지 단위 캐시 설정

`page.tsx` 또는 `layout.tsx`에서 export하면 페이지 전체에 적용됩니다.

```tsx
// SSG: 빌드 시 생성, 캐시 영구
export const dynamic = 'force-static'

// SSR: 매 요청마다 새로 생성
export const dynamic = 'force-dynamic'

// ISR: 60초마다 재생성
export const revalidate = 60
```

---

### ISR (Incremental Static Regeneration)

빌드 시 정적 페이지를 생성하되, 설정한 시간이 지나면 백그라운드에서 재생성합니다.

```
첫 번째 요청  → 캐시된 HTML 즉시 반환 (빠름)
60초 경과 후  → 다음 요청 시 백그라운드에서 재생성
재생성 완료   → 이후 요청부터 새 HTML 반환
```

```tsx
// app/board/page.tsx
export const revalidate = 60  // 60초마다 재검증

export default async function BoardListPage() {
  const boards = await fetch('/api/boards', {
    next: { revalidate: 60 }
  }).then(r => r.json())

  return <div>...</div>
}
```

---

### revalidatePath / revalidateTag

Server Action에서 특정 데이터/경로의 캐시를 즉시 무효화합니다.

```tsx
'use server'
import { revalidatePath, revalidateTag } from 'next/cache'

// 특정 경로 캐시 무효화
export async function updateBoard() {
  await db.board.update(...)
  revalidatePath('/board')         // /board 경로만
  revalidatePath('/board', 'layout') // /board 하위 전체
}

// 태그 기반 무효화
export async function updateCard() {
  await db.card.update(...)
  revalidateTag('cards')  // 'cards' 태그가 붙은 fetch 무효화
}
```

태그 붙이기:

```tsx
fetch('/api/cards', { next: { tags: ['cards'] } })
```

---

## 칸반 보드에서 왜 필요한가?

각 데이터마다 적합한 캐싱 전략이 다릅니다:

| 데이터 | 전략 | 이유 |
|--------|------|------|
| 보드 목록 | `revalidate: 60` (ISR) | 자주 안 바뀜, 빠른 로딩 필요 |
| 카드 목록 | `no-store` (SSR) | 실시간성 중요, 항상 최신 |
| 팀 멤버 목록 | `revalidate: 3600` (ISR) | 거의 안 바뀜 |
| 카드 추가/수정 후 | `revalidatePath` | 즉시 반영 필요 |

---

## 코드 예제

### 보드 목록 — ISR

```tsx
// app/board/page.tsx
export const revalidate = 60

async function getBoards() {
  const res = await fetch(`${process.env.API_URL}/boards`, {
    next: { revalidate: 60, tags: ['boards'] },
  })
  return res.json()
}

export default async function BoardListPage() {
  const boards = await getBoards()
  return (
    <ul>
      {boards.map((b: { id: string; title: string }) => (
        <li key={b.id}>{b.title}</li>
      ))}
    </ul>
  )
}
```

### 칸반 보드 상세 — no-store (항상 최신)

```tsx
// app/board/[boardId]/page.tsx
export const dynamic = 'force-dynamic'

async function getBoard(boardId: string) {
  const res = await fetch(`${process.env.API_URL}/boards/${boardId}`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('보드를 찾을 수 없습니다')
  return res.json()
}
```

### 카드 생성 후 캐시 무효화

```tsx
// lib/actions/board.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function createCard(columnId: string, title: string) {
  await db.card.create({ data: { title, columnId } })

  // 방법 1: 경로 기반
  revalidatePath(`/board/${columnId}`)

  // 방법 2: 태그 기반 (더 세밀한 제어)
  revalidateTag('cards')
}
```

---

## 체크리스트

- [ ] `no-store`, `force-cache`, `revalidate` 옵션의 차이를 안다
- [ ] ISR이 SSG와 다른 점을 설명할 수 있다
- [ ] `revalidatePath`와 `revalidateTag`를 언제 쓰는지 안다
- [ ] 보드 목록과 카드 목록에 서로 다른 캐싱 전략을 적용해봤다
- [ ] `export const revalidate = 60` 으로 페이지 단위 ISR을 설정했다
