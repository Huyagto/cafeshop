// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Highlands Coffee',
  description: 'Ứng dụng đặt cà phê và tích điểm',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  )
}