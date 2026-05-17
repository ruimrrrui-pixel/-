'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import RotatingBanner from '@/components/RotatingBanner'

const STATUS_COLORS: Record<string, string> = {
  '気になる': 'bg-gray-100 text-gray-700',
  '応募済み': 'bg-blue-100 text-blue-700',
  'ES提出': 'bg-yellow-100 text-yellow-700',
  '面接中': 'bg-orange-100 text-orange-700',
  '内定（合格）': 'bg-green-100 text-green-700',
  '不合格': 'bg-red-100 text-red-700',
  '辞退': 'bg-gray-100 text-gray-500',
}

export default function DashboardPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [recentCompanies, setRecentCompanies] = useState<{ id: string; name: string; status: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(20)

      if (companies) {
        const c: Record<string, number> = {}
        companies.forEach(co => { c[co.status] = (c[co.status] || 0) + 1 })
        setCounts(c)
        setRecentCompanies(companies.slice(0, 5))
      }
      setLoading(false)
    }
    load()
  }, [])

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : (
        <>
          {/* サマリーカード */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">登録企業数</p>
              <p className="text-3xl font-bold text-gray-800">{total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">面接中</p>
              <p className="text-3xl font-bold text-orange-500">{counts['面接中'] || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">内定（合格）</p>
              <p className="text-3xl font-bold text-green-500">{counts['内定（合格）'] || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">ES提出済み</p>
              <p className="text-3xl font-bold text-yellow-500">{counts['ES提出'] || 0}</p>
            </div>
          </div>

          {/* ステータス別内訳 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">ステータス別内訳</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                <span key={status} className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}>
                  {status} {counts[status] || 0}社
                </span>
              ))}
            </div>
          </div>

          {/* 最近追加した企業 */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">最近追加した企業</h2>
              <Link href="/companies" className="text-xs text-blue-600 hover:underline">すべて見る</Link>
            </div>
            {recentCompanies.length === 0 ? (
              <p className="text-sm text-gray-400">企業がまだ登録されていません</p>
            ) : (
              <ul className="space-y-2">
                {recentCompanies.map(co => (
                  <li key={co.id} className="flex items-center justify-between">
                    <Link href={`/companies/${co.id}`} className="text-sm text-gray-800 hover:text-blue-600">{co.name}</Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[co.status] || 'bg-gray-100 text-gray-600'}`}>
                      {co.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* バナー広告 */}
          <div className="mb-6">
            <RotatingBanner />
          </div>

          {/* クイックリンク */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { href: '/companies', label: '企業を追加', icon: '🏢' },
              { href: '/es', label: 'ES・テンプレート', icon: '📝' },
              { href: '/interviews', label: '面接メモを書く', icon: '🎤' },
              { href: '/ob', label: 'OB・OG訪問メモ', icon: '☕' },
              { href: '/research', label: '企業研究メモ', icon: '🔍' },
              { href: '/links', label: '就活サービス一覧', icon: '🔗' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition text-center"
              >
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-medium text-gray-700">{item.label}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
