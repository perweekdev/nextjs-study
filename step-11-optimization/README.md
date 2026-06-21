# Step 11 — 최적화

## 개념 설명

### next/image — 이미지 최적화

`<img>` 태그 대신 Next.js의 `<Image>` 컴포넌트를 쓰면:
- 자동 WebP/AVIF 변환 (파일 크기 대폭 감소)
- 화면 크기에 맞는 적절한 해상도 자동 제공
- Lazy loading 기본 적용 (뷰포트에 들어올 때 로딩)
- CLS(누적 레이아웃 이동) 방지 (`width`, `height` 필수)

```tsx
import Image from 'next/image'

// 로컬 이미지
import avatar from '@/public/avatar.png'

<Image
  src={avatar}
  alt="유저 아바타"
  width={40}
  height={40}
  className="rounded-full"
/>

// 외부 이미지 (next.config.js에 도메인 등록 필요)
<Image
  src="https://cdn.example.com/photo.jpg"
  alt="사진"
  width={800}
  height={600}
  priority  // LCP 이미지는 priority로 먼저 로딩
/>
```

---

### next/font — 폰트 최적화

외부 폰트를 런타임에 다운로드하지 않고 **빌드 시 자체 호스팅**합니다.
네트워크 요청 없이 폰트를 제공해 레이아웃 이동 없이 빠르게 로딩됩니다.

```tsx
// app/layout.tsx
import { Inter, Noto_Sans_KR } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

### next/link — 링크 최적화

`<Link>` 컴포넌트는 뷰포트에 들어오면 **링크 대상 페이지를 미리 prefetch**합니다.
사용자가 클릭하기 전에 이미 데이터가 준비되어 전환이 즉각적으로 느껴집니다.

```tsx
import Link from 'next/link'

// 기본 (자동 prefetch)
<Link href="/board/123">보드로 이동</Link>

// prefetch 비활성화 (데이터가 자주 바뀌는 경우)
<Link href="/board/123" prefetch={false}>보드로 이동</Link>
```

---

### 번들 분석

```bash
npm install @next/bundle-analyzer
```

```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({})
```

```bash
ANALYZE=true npm run build
```

---

## 칸반 보드에서 왜 필요한가?

칸반 보드에서 자주 등장하는 최적화 포인트:

| 요소 | 최적화 방법 |
|------|-------------|
| 팀 멤버 아바타 이미지 | `next/image` + `width/height` 고정 |
| 보드 커버 이미지 | `next/image` + `priority={false}` |
| 한글 UI 텍스트 | `next/font`로 Noto Sans KR 자체 호스팅 |
| 보드 목록 링크 | `next/link`로 자동 prefetch |
| 드래그 라이브러리 | 동적 import로 초기 번들 제외 |

---

## 코드 예제

### 팀 멤버 아바타

```tsx
// components/board/MemberAvatar.tsx
import Image from 'next/image'

type Props = {
  name: string
  avatarUrl: string
}

export default function MemberAvatar({ name, avatarUrl }: Props) {
  return (
    <div className="relative group">
      <Image
        src={avatarUrl}
        alt={name}
        width={32}
        height={32}
        className="rounded-full border-2 border-white"
      />
      {/* 호버 시 이름 툴팁 */}
      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}
```

### 외부 이미지 도메인 허용

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',  // GitHub 아바타
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',      // Google 아바타
      },
    ],
  },
}

module.exports = nextConfig
```

### 동적 import — 드래그앤드롭 라이브러리

```tsx
// components/board/KanbanBoard.tsx
'use client'

import dynamic from 'next/dynamic'

// 초기 번들에서 제외, 필요할 때만 로딩
const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then((mod) => mod.DragDropContext),
  { ssr: false }  // 드래그앤드롭은 서버에서 불필요
)

export default function KanbanBoard({ columns }: { columns: Column[] }) {
  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* 칸반 컬럼들 */}
    </DragDropContext>
  )
}
```

---

## 체크리스트

- [ ] `<img>` 대신 `next/image`를 쓰는 이유를 설명할 수 있다
- [ ] `width`, `height`를 지정해야 CLS가 방지되는 이유를 안다
- [ ] `next/font`로 Google 폰트를 자체 호스팅할 수 있다
- [ ] 외부 이미지 도메인을 `next.config.js`에 등록했다
- [ ] 드래그앤드롭 라이브러리를 동적 import로 분리했다

---

## 실습

> 📁 작업 위치: `project-kanban/kanban-board/`

### 1. 루트 레이아웃 — next/font 적용

```tsx
/* app/layout.tsx */
import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: { template: '%s | KanbanApp', default: 'KanbanApp' },
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.className} bg-gray-50 min-h-screen`}>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
```

### 2. next.config.js — 외부 이미지 도메인 허용

```js
/* next.config.js */
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',  // GitHub 아바타
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',      // Google 아바타
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',                 // 텍스트 아바타 생성 서비스
      },
    ],
  },
}

module.exports = nextConfig
```

### 3. 카드에 담당자 아바타 추가

```tsx
/* components/board/KanbanCard.tsx */
import Image from 'next/image'
import type { Card } from '@/types'

type Props = {
  card: Card
}

export default function KanbanCard({ card }: Props) {
  const avatarUrl = card.assignee
    ? `https://ui-avatars.com/api/?name=${encodeURIComponent(card.assignee)}&size=24&background=random`
    : null

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer">
      <p className="text-sm font-medium">{card.title}</p>
      {card.description && (
        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{card.description}</p>
      )}
      {avatarUrl && (
        <div className="flex items-center gap-1.5 mt-2">
          <Image
            src={avatarUrl}
            alt={card.assignee ?? ''}
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-xs text-gray-500">{card.assignee}</span>
        </div>
      )}
    </div>
  )
}
```

### 4. types/index.ts — assignee 필드 확인

```ts
/* types/index.ts */
export type Card = {
  id: string
  title: string
  description?: string
  assignee?: string   // 이미 있으면 OK
}

export type Column = {
  id: string
  title: string
  cards: Card[]
}

export type Board = {
  id: string
  title: string
  columns: Column[]
}
```

### 5. 확인

- 폰트가 한글 기준으로 Noto Sans KR로 바뀌었는지 확인
- 카드에 `assignee` 값이 있으면 아바타 이미지 표시 확인
- 브라우저 개발자 도구 → Network → Img 탭에서 WebP로 변환됐는지 확인
