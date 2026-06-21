# Step 01 — Next.js란?

## 개념 설명

### React vs Next.js

React는 UI를 만드는 **라이브러리**입니다. 라우팅, 데이터 패칭, 서버 렌더링은 직접 설정해야 합니다.

Next.js는 React 위에서 동작하는 **프레임워크**입니다. 아래 기능을 기본 제공합니다:

| 기능 | React (단독) | Next.js |
|------|-------------|---------|
| 라우팅 | react-router 별도 설치 | 파일 기반 자동 라우팅 |
| 서버 렌더링 | 직접 구성 | SSR / SSG / ISR 내장 |
| 데이터 패칭 | useEffect + fetch | Server Component에서 직접 async/await |
| 이미지 최적화 | 없음 | `next/image` 내장 |
| API 서버 | 별도 서버 필요 | API Routes 내장 |

### 렌더링 방식

```
CSR  (Client-Side Rendering)  → 브라우저에서 JS 실행 후 화면 그림
SSR  (Server-Side Rendering)  → 요청마다 서버에서 HTML 생성
SSG  (Static Site Generation) → 빌드 시점에 HTML 미리 생성
ISR  (Incremental Static Regen) → SSG + 주기적 재생성
```

Next.js는 페이지/컴포넌트 단위로 이 전략을 혼합해서 쓸 수 있습니다.

---

### App Router vs Pages Router

Next.js 13부터 **App Router**가 도입됐습니다. 현재(Next.js 14+) 공식 권장 방식입니다.

| 구분 | Pages Router (`/pages`) | App Router (`/app`) |
|------|------------------------|---------------------|
| 도입 시기 | Next.js 초창기 | Next.js 13+ |
| 렌더링 기본값 | CSR | **Server Component** |
| 레이아웃 | `_app.tsx` 하나 | `layout.tsx` 중첩 가능 |
| 데이터 패칭 | `getServerSideProps` / `getStaticProps` | 컴포넌트 안에서 `async/await` |
| 로딩/에러 처리 | 직접 구현 | `loading.tsx` / `error.tsx` 파일로 선언 |
| 학습 권장 | 레거시 코드베이스 | ✅ 신규 프로젝트 |

> 이 커리큘럼은 **App Router** 기준으로 진행합니다.

---

## 칸반 보드에서 왜 필요한가?

칸반 보드를 만들 때 렌더링 전략 선택이 핵심입니다:

- **보드 목록 페이지** → SSG (빠른 초기 로드)
- **카드 상세 페이지** → SSR (최신 데이터 필요)
- **드래그앤드롭 인터랙션** → CSR (클라이언트 컴포넌트)
- **팀원 목록** → ISR (자주 바뀌지 않음)

Next.js 없이 React만 쓴다면 모든 렌더링이 CSR이 되어 초기 로딩이 느리고 SEO에 불리합니다.

---

## 코드 예제

### 1. Next.js 프로젝트 생성

```bash
npx create-next-app@latest kanban-board \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir
cd kanban-board
npm run dev
```

옵션 설명:
- `--typescript` : TypeScript 사용
- `--tailwind` : Tailwind CSS 포함
- `--app` : App Router 사용
- `--no-src-dir` : `src/` 없이 루트에 `app/` 배치

### 2. 생성된 기본 구조 확인

```
kanban-board/
├── app/
│   ├── layout.tsx      ← 전체 레이아웃
│   ├── page.tsx        ← "/" 경로
│   └── globals.css
├── public/
├── next.config.js
├── package.json
└── tsconfig.json
```

### 3. 가장 단순한 Server Component

```tsx
// app/page.tsx
export default function HomePage() {
  return (
    <main>
      <h1>칸반 보드</h1>
      <p>Next.js App Router로 만드는 팀 협업 도구</p>
    </main>
  )
}
```

서버에서 렌더링되므로 `useState`, `useEffect` 없이도 동작합니다.

### 4. Client Component와의 차이

```tsx
// app/counter.tsx  ← 클라이언트 컴포넌트
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

`'use client'` 없이 `useState`를 쓰면 빌드 에러가 납니다. (Step 05에서 상세히 다룹니다)

---

## 체크리스트

- [ ] React와 Next.js의 차이를 한 문장으로 설명할 수 있다
- [ ] CSR / SSR / SSG / ISR의 차이를 안다
- [ ] App Router와 Pages Router의 차이를 안다
- [ ] `create-next-app`으로 프로젝트를 생성했다
- [ ] `npm run dev`로 로컬 서버를 띄웠다
- [ ] 브라우저에서 `http://localhost:3000` 확인했다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 프로젝트 생성

```bash
cd project-kanban
npx create-next-app@latest kanban-board --typescript --tailwind --app --no-src-dir
cd kanban-board
npm run dev
```

### 2. 전역 스타일 초기화

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. 홈 페이지 수정

```tsx
/* app/page.tsx */
import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">KanbanApp</h1>
      <p className="text-gray-500">팀 협업을 위한 칸반 보드</p>
      <Link
        href="/board"
        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
      >
        시작하기
      </Link>
    </main>
  )
}
```

### 4. 확인

브라우저에서 `http://localhost:3000` 접속 → 홈 화면 확인
