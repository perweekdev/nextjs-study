# Step 10 — API Routes

## 개념 설명

### route.ts란?

`app/` 디렉토리 안에 `route.ts` 파일을 두면 REST API 엔드포인트가 됩니다.
`page.tsx`와 같은 폴더에 있을 수 없고, 둘 중 하나만 존재해야 합니다.

```
app/
├── api/
│   ├── boards/
│   │   ├── route.ts          → GET /api/boards, POST /api/boards
│   │   └── [boardId]/
│   │       └── route.ts      → GET/PUT/DELETE /api/boards/:id
│   └── cards/
│       └── route.ts          → GET /api/cards, POST /api/cards
```

---

### HTTP 메서드 핸들러

각 HTTP 메서드를 함수로 export합니다.

```tsx
// app/api/boards/route.ts
import { NextRequest, NextResponse } from 'next/server'

// GET /api/boards
export async function GET() {
  const boards = await db.board.findMany()
  return NextResponse.json(boards)
}

// POST /api/boards
export async function POST(request: NextRequest) {
  const body = await request.json()
  const board = await db.board.create({ data: body })
  return NextResponse.json(board, { status: 201 })
}
```

지원 메서드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`

---

### 동적 파라미터

```tsx
// app/api/boards/[boardId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

type Context = { params: { boardId: string } }

export async function GET(request: NextRequest, { params }: Context) {
  const board = await db.board.findUnique({ where: { id: params.boardId } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(board)
}

export async function DELETE(request: NextRequest, { params }: Context) {
  await db.board.delete({ where: { id: params.boardId } })
  return new NextResponse(null, { status: 204 })
}
```

---

### 쿼리 파라미터

```tsx
// GET /api/cards?columnId=col-1&limit=10
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const columnId = searchParams.get('columnId')
  const limit = Number(searchParams.get('limit') ?? '20')

  const cards = await db.card.findMany({ where: { columnId }, take: limit })
  return NextResponse.json(cards)
}
```

---

### Server Action vs API Route

| 구분 | Server Action | API Route |
|------|--------------|-----------|
| 사용 위치 | Next.js 내부 (폼, 버튼) | 외부 클라이언트, 모바일 앱 |
| 호출 방식 | 함수 직접 호출 | HTTP 요청 |
| 타입 안전성 | ✅ TypeScript 완전 지원 | 수동 검증 필요 |
| 권장 용도 | 내부 데이터 변경 | 외부 API 제공 |

**결론**: 외부에 API를 제공해야 할 때만 `route.ts`를 씁니다. 내부 데이터 변경은 Server Action이 더 간결합니다.

---

## 칸반 보드에서 왜 필요한가?

칸반 보드 API 설계:

```
GET    /api/boards              → 보드 목록
POST   /api/boards              → 보드 생성
GET    /api/boards/:id          → 보드 상세
PUT    /api/boards/:id          → 보드 수정
DELETE /api/boards/:id          → 보드 삭제

GET    /api/boards/:id/cards    → 카드 목록
POST   /api/boards/:id/cards    → 카드 생성
PUT    /api/cards/:id           → 카드 수정 (컬럼 이동 포함)
DELETE /api/cards/:id           → 카드 삭제
```

모바일 앱이나 외부 서비스에서 칸반 보드 데이터를 쓰려면 API Route가 필요합니다.

---

## 코드 예제

### 보드 API

```tsx
// app/api/boards/route.ts
import { NextRequest, NextResponse } from 'next/server'

// 임시 데이터 (실제로는 DB)
const boards = [
  { id: 'board-1', title: '프로젝트 A', createdAt: new Date().toISOString() },
  { id: 'board-2', title: '프로젝트 B', createdAt: new Date().toISOString() },
]

export async function GET() {
  return NextResponse.json(boards)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  if (!body.title) {
    return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
  }

  const newBoard = {
    id: `board-${Date.now()}`,
    title: body.title,
    createdAt: new Date().toISOString(),
  }

  boards.push(newBoard)
  return NextResponse.json(newBoard, { status: 201 })
}
```

### 카드 이동 API (드래그앤드롭 결과 반영)

```tsx
// app/api/cards/[cardId]/move/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

type Context = { params: { cardId: string } }

export async function PATCH(request: NextRequest, { params }: Context) {
  const { targetColumnId, order } = await request.json()

  // 실제로는 DB 업데이트
  // await db.card.update({
  //   where: { id: params.cardId },
  //   data: { columnId: targetColumnId, order }
  // })

  revalidatePath('/board/[boardId]', 'page')

  return NextResponse.json({ success: true })
}
```

### 클라이언트에서 API 호출

```tsx
// components/board/KanbanCard.tsx
'use client'

async function moveCard(cardId: string, targetColumnId: string) {
  const res = await fetch(`/api/cards/${cardId}/move`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetColumnId }),
  })

  if (!res.ok) throw new Error('카드 이동에 실패했습니다')
  return res.json()
}
```

---

## 체크리스트

- [ ] `route.ts`로 GET, POST 엔드포인트를 만들 수 있다
- [ ] 동적 파라미터 `[boardId]`를 route.ts에서 받을 수 있다
- [ ] 쿼리 파라미터를 `searchParams`로 읽을 수 있다
- [ ] Server Action과 API Route를 언제 쓰는지 구분할 수 있다
- [ ] 카드 이동(드래그앤드롭) API를 설계해봤다
