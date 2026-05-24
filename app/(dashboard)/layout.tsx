'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: '🏠' },
  { href: '/schedule', label: '日程管理', icon: '📅' },
  { href: '/companies', label: '企業管理', icon: '🏢' },
  { href: '/es', label: 'ES・テンプレート', icon: '📝' },
  { href: '/interviews', label: '面接メモ', icon: '🎤' },
  { href: '/ob', label: 'OB・OG訪問', icon: '☕' },
  { href: '/research', label: '企業研究', icon: '🔍' },
  { href: '/news', label: 'ニュース', icon: '📰' },
  { href: '/links', label: '就活サービス', icon: '🔗' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login')
      } else {
        setUserEmail(data.user.email ?? '')
      }
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* サイドバー（PC） */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 py-6 px-3">
        <div className="text-center mb-8">
          <span className="text-2xl">🎓</span>
          <p className="text-sm font-bold text-gray-800 mt-1">就活管理</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 pt-4 mt-4">
          <p className="text-xs text-gray-400 px-3 mb-2 truncate">{userEmail}</p>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* モバイルヘッダー */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-gray-800">🎓 就活管理</span>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-600 text-xl">☰</button>
      </div>

      {/* モバイルメニュー */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setMenuOpen(false)}>
          <div className="bg-white w-56 h-full py-6 px-3" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1 mt-8">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === item.href ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <button onClick={handleLogout} className="mt-4 w-full text-left px-3 py-2 text-sm text-red-500">
              ログアウト
            </button>
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
