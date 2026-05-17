import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '就活管理アプリ',
  description: '就活を効率よく管理するWebアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
