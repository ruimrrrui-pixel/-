'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ADMIN_EMAIL = 'rui.mrr.rui@gmail.com'

interface UserStat {
  user_id: string
  email: string
  created_at: string
  last_sign_in_at: string
  company_count: number
  es_count: number
  template_count: number
}

interface AdminStats {
  total_users: number
  total_companies: number
  total_es: number
  users: UserStat[]
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user || user.email !== ADMIN_EMAIL) {
        setUnauthorized(true)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_admin_stats')
      if (error || !data) {
        setUnauthorized(true)
      } else {
        setStats(data)
      }
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <p className="text-gray-400">読み込み中...</p>

  if (unauthorized) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500">アクセス権限がありません</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理者ダッシュボード</h1>

      {/* サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">登録ユーザー数</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_users ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">登録企業数（合計）</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.total_companies ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">ES数（合計）</p>
          <p className="text-3xl font-bold text-gray-800">{stats?.total_es ?? 0}</p>
        </div>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">ユーザー一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">メールアドレス</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">登録企業</th>
                <th className="text-center px-4 py-3 text-xs text-gray-500 font-medium">ES数</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">登録日</th>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">最終ログイン</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.users?.map((u, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{u.email}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{u.company_count}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{u.es_count}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ja-JP') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('ja-JP') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
