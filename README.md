# Next.js Study — 커리큘럼

> **실습 프로젝트**: 칸반 보드 (드래그앤드롭 · 팀 협업 · 실시간 업데이트)  
> 각 Step의 핵심 개념이 칸반 보드 구현과 어떻게 연결되는지 함께 설명합니다.

---

## 목차

| Step | 주제 | 상태 |
|------|------|------|
| [Step 01](./step-01-intro/README.md) | Next.js란? — React와의 차이, App Router vs Pages Router | 🔜 |
| [Step 02](./step-02-structure/README.md) | 프로젝트 구조 — 폴더 컨벤션, app/ 디렉토리 | 🔜 |
| [Step 03](./step-03-routing/README.md) | 라우팅 기초 — 파일 기반 라우팅, 동적 라우트 | 🔜 |
| [Step 04](./step-04-layout/README.md) | 레이아웃 & 템플릿 — layout.tsx, 중첩 레이아웃 | 🔜 |
| [Step 05](./step-05-components/README.md) | 서버 vs 클라이언트 컴포넌트 — "use client", 렌더링 전략 | 🔜 |
| [Step 06](./step-06-data-fetching/README.md) | 데이터 패칭 — fetch(), loading.tsx, error.tsx | 🔜 |
| [Step 07](./step-07-server-actions/README.md) | Server Actions — 폼 처리, revalidatePath | 🔜 |
| [Step 08](./step-08-caching/README.md) | 캐싱 전략 — no-store / force-cache / ISR | 🔜 |
| [Step 09](./step-09-middleware/README.md) | 미들웨어 — 인증 가드, middleware.ts | 🔜 |
| [Step 10](./step-10-api-routes/README.md) | API Routes — route.ts, REST 엔드포인트 | 🔜 |
| [Step 11](./step-11-optimization/README.md) | 최적화 — next/image, next/font, next/link | 🔜 |
| [Step 12](./step-12-deploy/README.md) | 배포 — Vercel, 환경변수, next.config.js | 🔜 |
| [Project](./project-kanban/README.md) | 실습 프로젝트 — 칸반 보드 전체 구현 | 🔜 |
| **심화** | | |
| [Step 13](./step-13-zustand/README.md) | 클라이언트 전역 상태 — Zustand, selector, Provider 패턴 | 🔜 |
| [Step 14](./step-14-tanstack-query/README.md) | 서버 상태 관리 — TanStack Query, 낙관적 업데이트, Hydration | 🔜 |

---

## 학습 방법

각 Step 폴더의 `README.md`에서 아래 구성으로 학습합니다:

1. **개념 설명** — 핵심 개념 정리
2. **칸반 보드에서 왜 필요한가?** — 실습 프로젝트 연결
3. **코드 예제** — 직접 실행 가능한 예제
4. **체크리스트** — 학습 확인 항목

---

## 실습 프로젝트: 칸반 보드

```
칸반 보드 기능
├── 보드 & 컬럼 관리 (Todo / In Progress / Done)
├── 카드 CRUD (생성·수정·삭제)
├── 드래그앤드롭 (카드 이동)
├── 팀 협업 (멤버 할당)
└── 실시간 업데이트
```

각 Step이 이 프로젝트의 어느 부분에 적용되는지 Step별 README에서 확인할 수 있습니다.

---

## 환경

- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Node.js 18+
