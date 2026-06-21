import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'

export const metadata: Metadata = {
  title: {
    template: '%s | KanbanApp',  // 각 페이지 제목 뒤에 자동으로 붙음
    default: 'KanbanApp',
  },
  description: '팀 협업 칸반 보드',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}