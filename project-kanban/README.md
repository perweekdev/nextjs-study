# 실습 프로젝트 — 칸반 보드

## 프로젝트 개요

각 Step에서 배운 개념을 통합한 **팀 협업 칸반 보드**를 구현합니다.

```
기능 목록:
├── 보드 CRUD (생성 · 수정 · 삭제)
├── 컬럼 관리 (Todo / In Progress / Done + 커스텀)
├── 카드 CRUD (제목, 설명, 담당자, 마감일)
├── 드래그앤드롭 (카드 이동, 컬럼 간 이동)
├── 팀 멤버 초대 & 권한 관리
└── 실시간 업데이트 (다른 사용자 변경 즉시 반영)
```

---

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js 14+ (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS |
| DB | PostgreSQL (Vercel Postgres or Supabase) |
| ORM | Prisma |
| 인증 | NextAuth.js |
| 드래그앤드롭 | @hello-pangea/dnd |
| 실시간 | Pusher or Supabase Realtime |
| 배포 | Vercel |

---

## 폴더 구조

```
kanban-board/
├── app/
│   ├── layout.tsx                   # Step 04 — 루트 레이아웃
│   ├── page.tsx                     # 홈 (보드 목록)
│   ├── (auth)/
│   │   ├── login/page.tsx           # Step 09 — 인증
│   │   └── register/page.tsx
│   └── board/
│       ├── layout.tsx               # Step 04 — 보드 사이드바 레이아웃
│       ├── page.tsx                 # 보드 목록 (Step 06, 08)
│       ├── new/page.tsx             # 보드 생성 (Step 07)
│       └── [boardId]/
│           ├── page.tsx             # 칸반 뷰 (Step 03, 05, 06)
│           ├── loading.tsx          # Step 06 — 로딩 스켈레톤
│           ├── error.tsx            # Step 06 — 에러 처리
│           └── settings/page.tsx   # 보드 설정
├── components/
│   ├── board/
│   │   ├── KanbanBoard.tsx          # Step 05 — Client Component
│   │   ├── Column.tsx               # Step 05 — Server Component
│   │   ├── KanbanCard.tsx           # Step 11 — next/image
│   │   ├── AddCardForm.tsx          # Step 07 — Server Action 폼
│   │   └── MemberAvatar.tsx        # Step 11 — 이미지 최적화
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── Skeleton.tsx
├── lib/
│   ├── db.ts                        # Prisma 클라이언트
│   ├── auth.ts                      # NextAuth 설정
│   ├── env.ts                       # 환경변수 검증
│   └── actions/
│       ├── board.ts                 # Step 07 — Board Server Actions
│       ├── card.ts                  # Step 07 — Card Server Actions
│       └── column.ts
├── app/api/
│   ├── boards/route.ts              # Step 10 — REST API
│   └── cards/[cardId]/route.ts
├── middleware.ts                    # Step 09 — 인증 가드
└── next.config.js                   # Step 12 — 배포 설정
```

---

## Step별 구현 로드맵

### Step 01-02 — 프로젝트 세팅
```bash
npx create-next-app@latest kanban-board --typescript --tailwind --app
cd kanban-board
npm install prisma @prisma/client
npm install @hello-pangea/dnd
```

### Step 03 — 라우팅 구조 세팅
```
/                    → 홈
/board               → 보드 목록
/board/[boardId]     → 칸반 뷰
/board/new           → 보드 생성
/login, /register    → 인증
```

### Step 04 — 레이아웃
- 루트: GNB (로고 + 유저 메뉴)
- board/: 좌측 사이드바 (내 보드 목록)

### Step 05 — 컴포넌트 분리
```
BoardPage       (Server) → DB 조회
  ColumnList    (Server) → 컬럼 렌더링
    Column      (Server) → 카드 목록
      KanbanCard (Server) → 카드 정보
  DragProvider (Client)  → 드래그앤드롭
  AddCardForm  (Client)  → 카드 추가 인풋
```

### Step 06 — 데이터 패칭
- `loading.tsx`로 스켈레톤 UI
- `error.tsx`로 에러 처리
- `Promise.all`로 보드 + 멤버 병렬 조회

### Step 07 — Server Actions
```ts
createCard(columnId, formData)
updateCard(cardId, data)
deleteCard(cardId)
moveCard(cardId, targetColumnId, order)
```

### Step 08 — 캐싱
- 보드 목록: `revalidate: 60` (ISR)
- 칸반 뷰: `no-store` (실시간 필요)
- 카드 변경 후: `revalidatePath` 호출

### Step 09 — 미들웨어
- `/board/*` 인증 가드
- 미인증 → `/login?from=/board/123`

### Step 10 — API Routes
- `GET /api/boards` — 보드 목록 (모바일 앱용)
- `PATCH /api/cards/:id/move` — 카드 이동

### Step 11 — 최적화
- 멤버 아바타: `next/image`
- 한글 폰트: `next/font` (Noto Sans KR)
- 드래그 라이브러리: dynamic import

### Step 12 — 배포
- Vercel 연동
- 환경변수: `DATABASE_URL`, `NEXTAUTH_SECRET`
- PR → Preview URL 자동 생성

---

## 핵심 데이터 모델 (Prisma)

```prisma
model Board {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
  columns   Column[]
  members   BoardMember[]
}

model Column {
  id      String   @id @default(cuid())
  title   String
  order   Int
  boardId String
  board   Board    @relation(fields: [boardId], references: [id])
  cards   Card[]
}

model Card {
  id          String   @id @default(cuid())
  title       String
  description String?
  order       Int
  columnId    String
  column      Column   @relation(fields: [columnId], references: [id])
  assigneeId  String?
  dueDate     DateTime?
  createdAt   DateTime @default(now())
}

model BoardMember {
  id      String @id @default(cuid())
  boardId String
  userId  String
  role    String @default("member")  // owner | member
  board   Board  @relation(fields: [boardId], references: [id])
}
```

---

## 체크리스트

### 기본 구현
- [ ] 보드 생성 · 목록 · 삭제
- [ ] 컬럼 추가 · 삭제
- [ ] 카드 생성 · 수정 · 삭제
- [ ] 카드 드래그앤드롭 (컬럼 간 이동)
- [ ] 로그인 / 로그아웃

### 심화 구현
- [ ] 팀 멤버 초대
- [ ] 카드 담당자 지정
- [ ] 카드 마감일 설정
- [ ] 실시간 업데이트 (Pusher or Supabase)
- [ ] 모바일 반응형
- [ ] Vercel 배포 완료
