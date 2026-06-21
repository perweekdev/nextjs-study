# Step 09 — 미들웨어

## 개념 설명

### middleware.ts란?

미들웨어는 **요청이 처리되기 전에 실행되는 함수**입니다.
사용자가 페이지에 접근하기 전에 인증 확인, 리다이렉트, 헤더 수정 등을 할 수 있습니다.

```
사용자 요청 → 미들웨어 실행 → 페이지/API 처리 → 응답
```

파일 위치: **프로젝트 루트** (app/ 바깥)

```
my-app/
├── app/
├── middleware.ts    ← 여기
├── next.config.js
└── package.json
```

---

### 기본 구조

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 요청 처리
  return NextResponse.next()  // 다음으로 진행
}

// 어떤 경로에 미들웨어를 적용할지 설정
export const config = {
  matcher: ['/board/:path*', '/api/:path*'],
}
```

---

### matcher — 적용 경로 설정

```tsx
export const config = {
  matcher: [
    // 특정 경로
    '/board/:path*',

    // 여러 경로
    '/(dashboard|settings)/:path*',

    // 정적 파일 제외
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

### NextResponse 메서드

```tsx
// 다음으로 진행
NextResponse.next()

// 리다이렉트
NextResponse.redirect(new URL('/login', request.url))

// 리라이트 (URL은 그대로, 다른 경로 처리)
NextResponse.rewrite(new URL('/not-found', request.url))

// 헤더 수정
const response = NextResponse.next()
response.headers.set('x-custom-header', 'value')
return response
```

---

### 인증 가드 패턴

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // 공개 경로는 통과
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }

  // 토큰 없으면 로그인 페이지로
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)  // 원래 가려던 경로 저장
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

---

## 칸반 보드에서 왜 필요한가?

칸반 보드는 로그인한 사용자만 접근해야 합니다.

```
/              → 공개 (랜딩 페이지)
/login         → 공개
/register      → 공개
/board/*       → 🔒 로그인 필요
/api/*         → 🔒 API 키 or 토큰 필요
```

미들웨어 없이 각 페이지에서 인증을 체크하면 코드가 중복됩니다.
미들웨어 한 곳에서 처리하면 보호가 일관성 있게 적용됩니다.

---

## 코드 예제

### 칸반 보드 인증 미들웨어

```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 로그인 없이 접근 가능한 경로
const PUBLIC_PATHS = ['/', '/login', '/register']

// 미들웨어 실행 제외 경로
const EXCLUDED = /^\/(_next|api\/public|favicon\.ico)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 정적 파일, 공개 API 제외
  if (EXCLUDED.test(pathname)) return NextResponse.next()

  // 공개 경로 통과
  if (PUBLIC_PATHS.some((p) => pathname === p)) return NextResponse.next()

  // 인증 토큰 확인 (실제로는 JWT 검증)
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }

  // 요청 헤더에 유저 정보 추가 (서버 컴포넌트에서 사용 가능)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-token', token)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
}
```

### 로그인 후 원래 경로로 돌아가기

```tsx
// app/login/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const from = searchParams.get('from') ?? '/board'

  async function handleLogin(formData: FormData) {
    // 로그인 로직 (쿠키 설정)
    document.cookie = `auth-token=demo-token; path=/`
    router.push(from)   // 원래 가려던 페이지로
  }

  return (
    <form action={handleLogin} className="max-w-sm mx-auto mt-20 space-y-4">
      <h1 className="text-xl font-bold">로그인</h1>
      <input name="email" type="email" placeholder="이메일" className="w-full border rounded p-2" />
      <input name="password" type="password" placeholder="비밀번호" className="w-full border rounded p-2" />
      <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
        로그인
      </button>
    </form>
  )
}
```

---

## 체크리스트

- [ ] `middleware.ts`의 위치가 `app/` 바깥 루트라는 것을 안다
- [ ] `matcher`로 미들웨어 적용 경로를 제한할 수 있다
- [ ] 인증 토큰이 없을 때 `/login`으로 리다이렉트할 수 있다
- [ ] `from` 파라미터로 로그인 후 원래 경로로 돌아가도록 구현했다
- [ ] 정적 파일 경로는 미들웨어에서 제외했다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 미들웨어 생성

```ts
/* middleware.ts  ← app/ 바깥, 프로젝트 루트에 생성 */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 공개 경로는 통과
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next()

  // 인증 토큰 확인
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  // 정적 파일, 이미지, favicon 제외
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 2. 로그인 레이아웃 생성

```tsx
/* app/(auth)/layout.tsx */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      {children}
    </div>
  )
}
```

### 3. 로그인 페이지 생성

```tsx
/* app/(auth)/login/page.tsx */
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const from = searchParams.get('from') ?? '/board'

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    // 실제 인증 로직 자리 (Step 이후 NextAuth로 교체)
    document.cookie = 'auth-token=demo-token; path=/'
    router.push(from)
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 p-8 bg-white rounded-xl border shadow-sm">
      <h1 className="text-xl font-bold text-center">로그인</h1>
      <input
        type="email"
        placeholder="이메일"
        defaultValue="demo@example.com"
        className="w-full border rounded-lg p-3 text-sm"
      />
      <input
        type="password"
        placeholder="비밀번호"
        defaultValue="password"
        className="w-full border rounded-lg p-3 text-sm"
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
      >
        로그인
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
```

### 4. 확인

- `http://localhost:3000/board` 접속 → `/login?from=/board` 로 리다이렉트
- 로그인 버튼 클릭 → 쿠키 설정 후 `/board` 로 이동
- 이후 `/board` 직접 접속 → 정상 접근 (쿠키 있음)
- 브라우저 쿠키 삭제 후 `/board` 재접속 → 다시 로그인 페이지로
