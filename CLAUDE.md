# Next.js 학습 프로젝트 — Claude 컨텍스트

## 학습자 정보
- 이름: MinLab
- 목표: Next.js App Router 마스터 + 칸반 보드 실습 프로젝트 완성
- 수준: React 기본 지식 보유, Next.js 입문

## 이 저장소의 구조
- `step-01-intro` ~ `step-12-deploy`: 순서대로 학습하는 교육자료 (각 README.md)
- `project-kanban`: 전체 개념을 통합하는 실습 프로젝트 설계

## 커리큘럼 진행 순서
1. Next.js란? (App Router vs Pages Router)
2. 프로젝트 구조 (app/ 디렉토리, 특수 파일)
3. 라우팅 기초 (파일 기반, 동적 라우트)
4. 레이아웃 & 템플릿 (layout.tsx, 중첩)
5. 서버 vs 클라이언트 컴포넌트 (`use client`)
6. 데이터 패칭 (fetch, loading.tsx, error.tsx)
7. Server Actions (폼 처리, revalidatePath)
8. 캐싱 전략 (no-store / force-cache / ISR)
9. 미들웨어 (인증 가드, middleware.ts)
10. API Routes (route.ts, REST)
11. 최적화 (next/image, next/font, next/link)
12. 배포 (Vercel, 환경변수)

## 실습 프로젝트
**칸반 보드** — 드래그앤드롭, 팀 협업, 실시간 업데이트
- 기술 스택: Next.js 14+, TypeScript, Tailwind CSS, Prisma, NextAuth.js
- 각 Step 개념이 칸반 보드의 어느 부분에 적용되는지 연결해서 설명할 것

## Claude에게 요청하는 역할
- 각 Step 개념을 설명할 때 **칸반 보드 구현과 항상 연결**해서 설명
- 코드 예제는 **직접 실행 가능한 수준**으로 작성
- 모르는 개념은 **React와 비교**해서 설명 (React 기초 지식 있음)
- 에러 발생 시 원인과 해결책을 **단계별**로 설명
- 코드 리뷰 요청 시 **Next.js App Router 베스트 프랙티스** 기준으로 피드백

## 현재 사용 중인 기술 버전
- Next.js: 14+
- Node.js: 18+
- TypeScript: 5+
- Tailwind CSS: 3+

## 학습 규칙
- 한국어로 소통
- 코드는 TypeScript 기준
- App Router 기준 (Pages Router 설명 불필요)
- 개념 설명 후 반드시 칸반 보드 적용 예시 포함
