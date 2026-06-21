# Step 07 — Server Actions

## 개념 설명

### Server Actions란?

Server Actions는 **클라이언트에서 호출하지만 서버에서 실행되는 함수**입니다.
API 라우트(`route.ts`)를 별도로 만들지 않고도 폼 제출, 데이터 변경을 처리할 수 있습니다.

```tsx
// 이 함수는 서버에서만 실행됩니다
async function createCard(formData: FormData) {
  'use server'
  const title = formData.get('title') as string
  await db.card.create({ data: { title } })
}
```

---

### 선언 방법 두 가지

**1. 파일 최상단에 `'use server'` (actions 파일 분리 권장)**

```tsx
// lib/actions/card.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createCard(formData: FormData) {
  const title = formData.get('title') as string
  // DB 저장 로직
  await db.card.create({ data: { title, columnId: '...' } })
  revalidatePath('/board/[boardId]')
}
```

**2. 함수 내부에 `'use server'`**

```tsx
// 서버 컴포넌트 안에서 인라인 정의
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server'
    // 서버 로직
  }
  return <form action={handleSubmit}>...</form>
}
```

---

### revalidatePath / revalidateTag

데이터를 변경한 후 캐시를 무효화해 최신 데이터가 보이게 합니다.

```tsx
'use server'
import { revalidatePath } from 'next/cache'

export async function deleteCard(cardId: string) {
  await db.card.delete({ where: { id: cardId } })
  revalidatePath('/board/[boardId]')  // 해당 경로 캐시 초기화
}
```

---

### useFormState / useFormStatus (React 19+: useActionState)

```tsx
'use client'

import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button disabled={pending}>
      {pending ? '저장 중...' : '저장'}
    </button>
  )
}
```

---

## 칸반 보드에서 왜 필요한가?

칸반 보드의 모든 데이터 변경이 Server Actions로 처리됩니다:

```
createCard(formData)     ← 카드 생성
updateCard(id, data)     ← 카드 수정
deleteCard(id)           ← 카드 삭제
moveCard(id, columnId)   ← 카드 이동 (드래그앤드롭)
createColumn(formData)   ← 컬럼 추가
```

별도 API 엔드포인트 없이 바로 DB 조작 → 코드 양이 절반으로 줄어듭니다.

---

## 코드 예제

### 카드 생성 Server Action

```tsx
// lib/actions/card.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createCard(columnId: string, formData: FormData) {
  const title = formData.get('title') as string

  if (!title.trim()) return { error: '제목을 입력하세요' }

  // 실제로는 DB 저장
  console.log(`카드 생성: ${title} → 컬럼 ${columnId}`)

  revalidatePath('/board/[boardId]', 'page')
}

export async function deleteCard(cardId: string) {
  // 실제로는 DB 삭제
  console.log(`카드 삭제: ${cardId}`)
  revalidatePath('/board/[boardId]', 'page')
}
```

### 폼과 연결

```tsx
// components/board/AddCardForm.tsx
'use client'

import { useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createCard } from '@/lib/actions/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
    >
      {pending ? '추가 중...' : '추가'}
    </button>
  )
}

export default function AddCardForm({ columnId }: { columnId: string }) {
  const ref = useRef<HTMLFormElement>(null)

  const action = async (formData: FormData) => {
    await createCard(columnId, formData)
    ref.current?.reset()  // 폼 초기화
  }

  return (
    <form ref={ref} action={action} className="mt-2 space-y-2">
      <input
        name="title"
        placeholder="카드 제목 입력..."
        className="w-full border rounded p-2 text-sm"
        required
      />
      <SubmitButton />
    </form>
  )
}
```

### 카드 삭제 버튼

```tsx
// components/board/DeleteCardButton.tsx
'use client'

import { deleteCard } from '@/lib/actions/card'

export default function DeleteCardButton({ cardId }: { cardId: string }) {
  return (
    <form action={() => deleteCard(cardId)}>
      <button
        type="submit"
        className="text-xs text-red-400 hover:text-red-600"
      >
        삭제
      </button>
    </form>
  )
}
```

---

## 체크리스트

- [ ] Server Action과 API Route의 차이를 설명할 수 있다
- [ ] `'use server'`를 파일 최상단에 선언하는 방식을 이해했다
- [ ] `revalidatePath`로 캐시를 무효화할 수 있다
- [ ] `useFormStatus`로 로딩 상태를 표시할 수 있다
- [ ] 카드 생성 폼을 Server Action으로 구현해봤다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 인메모리 스토어 생성

DB 연동 전까지 사용하는 임시 저장소입니다.

```ts
/* lib/store.ts */
import type { Board } from '@/types'

// 서버 메모리에 저장 (개발용 — 실제 배포 시 DB로 교체)
export const store: { boards: Board[] } = {
  boards: [
    {
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
        { id: 'col-2', title: 'In Progress', cards: [{ id: 'card-3', title: 'Navbar 구현' }] },
        { id: 'col-3', title: 'Done', cards: [{ id: 'card-4', title: '프로젝트 세팅' }] },
      ],
    },
    { id: 'board-2', title: '프로젝트 B', columns: [] },
  ],
}
```

### 2. lib/data.ts 업데이트 — store에서 읽기

```ts
/* lib/data.ts */
import { store } from './store'
import type { Board } from '@/types'

export async function getBoards() {
  return store.boards.map(({ id, title }) => ({ id, title }))
}

export async function getBoard(boardId: string): Promise<Board> {
  const board = store.boards.find((b) => b.id === boardId)
  if (!board) throw new Error('보드를 찾을 수 없습니다')
  return board
}
```

### 3. 카드 Server Actions 생성

```ts
/* lib/actions/card.ts */
'use server'

import { revalidatePath } from 'next/cache'
import { store } from '../store'

// 카드 생성
export async function createCard(columnId: string, formData: FormData) {
  const title = formData.get('title') as string
  if (!title?.trim()) return

  for (const board of store.boards) {
    const column = board.columns.find((c) => c.id === columnId)
    if (column) {
      column.cards.push({ id: `card-${Date.now()}`, title: title.trim() })
      break
    }
  }
  revalidatePath('/board/[boardId]', 'page')
}

// 카드 삭제
export async function deleteCard(cardId: string) {
  for (const board of store.boards) {
    for (const column of board.columns) {
      const idx = column.cards.findIndex((c) => c.id === cardId)
      if (idx !== -1) {
        column.cards.splice(idx, 1)
        break
      }
    }
  }
  revalidatePath('/board/[boardId]', 'page')
}
```

### 4. 보드 Server Actions 생성

```ts
/* lib/actions/board.ts */
'use server'

import { redirect } from 'next/navigation'
import { store } from '../store'

// 보드 생성
export async function createBoard(formData: FormData) {
  const title = formData.get('title') as string
  if (!title?.trim()) return

  const newBoard = {
    id: `board-${Date.now()}`,
    title: title.trim(),
    columns: [
      { id: `col-${Date.now()}-1`, title: 'Todo', cards: [] },
      { id: `col-${Date.now()}-2`, title: 'In Progress', cards: [] },
      { id: `col-${Date.now()}-3`, title: 'Done', cards: [] },
    ],
  }
  store.boards.push(newBoard)
  redirect(`/board/${newBoard.id}`)
}
```

### 5. 카드 추가 폼 컴포넌트 업데이트

```tsx
/* components/board/AddCardButton.tsx */
'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { createCard } from '@/lib/actions/card'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-blue-500 text-white text-xs px-3 py-1 rounded disabled:opacity-50"
    >
      {pending ? '추가 중...' : '추가'}
    </button>
  )
}

export default function AddCardButton({ columnId }: { columnId: string }) {
  const [open, setOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const action = async (formData: FormData) => {
    await createCard(columnId, formData)
    formRef.current?.reset()
    setOpen(false)
  }

  return (
    <div className="mt-2">
      {open ? (
        <form ref={formRef} action={action} className="bg-white border rounded-lg p-2 space-y-2">
          <input
            name="title"
            className="w-full border rounded p-1.5 text-sm"
            placeholder="카드 제목 입력..."
            autoFocus
            required
          />
          <div className="flex gap-2 items-center">
            <SubmitButton />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-left text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-200 px-2 py-1.5 rounded-lg"
        >
          + 카드 추가
        </button>
      )}
    </div>
  )
}
```

### 6. 새 보드 생성 폼 업데이트

```tsx
/* app/board/new/page.tsx */
import { createBoard } from '@/lib/actions/board'

export default function NewBoardPage() {
  return (
    <main className="p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">새 보드 만들기</h1>
      <form action={createBoard} className="space-y-4">
        <input
          name="title"
          placeholder="보드 이름"
          required
          className="w-full border rounded-lg p-3 text-sm"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
        >
          만들기
        </button>
      </form>
    </main>
  )
}
```

### 7. 확인

- `/board/new` → 보드 이름 입력 후 제출 → 새 보드 상세 페이지로 이동
- `/board/board-1` → `+ 카드 추가` → 카드 입력 후 추가 → 카드 목록에 즉시 반영
