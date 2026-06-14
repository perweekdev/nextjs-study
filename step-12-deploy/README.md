# Step 12 — 배포

## 개념 설명

### Vercel 배포 (권장)

Next.js를 만든 회사가 Vercel입니다. 가장 쉽고 최적화된 배포 환경을 제공합니다.

```
GitHub 연동 → 자동 배포 파이프라인:

코드 push
  → Vercel 빌드 트리거
  → next build 실행
  → Edge Network에 배포
  → https://your-app.vercel.app 접근 가능
```

PR을 열면 **Preview URL**이 자동 생성되어 배포 전 미리 확인할 수 있습니다.

---

### 환경변수

```
개발 환경  → .env.local       (git에 포함 안 됨, 로컬 전용)
프로덕션   → Vercel Dashboard → Settings → Environment Variables
```

```bash
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/kanban"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

**Next.js 환경변수 규칙**:

| 접두사 | 접근 가능 위치 |
|--------|---------------|
| (없음) | 서버 전용 (절대 클라이언트에 노출 안 됨) |
| `NEXT_PUBLIC_` | 서버 + 클라이언트 모두 접근 가능 |

```tsx
// 서버에서만 사용 (안전)
const dbUrl = process.env.DATABASE_URL

// 클라이언트에서도 사용 가능 (공개 정보만)
const apiUrl = process.env.NEXT_PUBLIC_API_URL
```

---

### next.config.js 주요 설정

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 외부 도메인
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  // 빌드 시 TypeScript 에러 무시 (권장 안 함)
  // typescript: { ignoreBuildErrors: true },

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/old-path',
        destination: '/new-path',
        permanent: true,  // 301
      },
    ]
  },

  // 헤더 추가
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

### 빌드 & 배포 명령어

```bash
# 로컬에서 프로덕션 빌드 테스트
npm run build
npm run start

# 타입 체크
npx tsc --noEmit

# 린트
npm run lint
```

---

### Vercel 배포 절차

1. [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 로그인)
2. "New Project" → GitHub 저장소 선택
3. 환경변수 입력 (`DATABASE_URL` 등)
4. Deploy 클릭

이후 `git push origin main` 할 때마다 자동 배포됩니다.

---

## 칸반 보드에서 왜 필요한가?

```
로컬 개발:
  npm run dev → http://localhost:3000

스테이징 (PR Preview):
  GitHub PR → Vercel 자동 Preview URL 생성
  팀원이 변경사항 미리 확인 가능

프로덕션:
  main 브랜치 push → Vercel 자동 배포
  https://kanban-app.vercel.app
```

환경별로 DATABASE_URL을 다르게 설정해 로컬/스테이징/프로덕션 DB를 분리합니다.

---

## 코드 예제

### 환경변수 타입 안전하게 쓰기

```tsx
// lib/env.ts
function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`환경변수 ${key}가 설정되지 않았습니다`)
  return value
}

export const env = {
  databaseUrl: getEnv('DATABASE_URL'),
  nextAuthSecret: getEnv('NEXTAUTH_SECRET'),
  nextAuthUrl: getEnv('NEXTAUTH_URL'),
}
```

### 프로덕션 배포 전 체크리스트 자동화

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "check": "npm run type-check && npm run lint && npm run build"
  }
}
```

```bash
# 배포 전 한 번에 검증
npm run check
```

### Vercel 환경변수 설정 (.env.local 예시)

```bash
# .env.local (로컬 전용, .gitignore에 포함됨)
DATABASE_URL="postgresql://postgres:password@localhost:5432/kanban_dev"
NEXTAUTH_SECRET="local-dev-secret-min-32-chars-long"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="KanbanApp"
```

---

## 체크리스트

- [ ] `NEXT_PUBLIC_` 접두사의 의미를 안다
- [ ] `.env.local`이 `.gitignore`에 포함되어 있는지 확인했다
- [ ] `npm run build`로 빌드 에러가 없는지 확인했다
- [ ] Vercel에 프로젝트를 연결하고 환경변수를 설정했다
- [ ] GitHub에 push하면 자동 배포가 되는지 확인했다
