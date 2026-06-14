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
