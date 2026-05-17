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
  interview_count: number
  research_count: number
  ob_count: number
}

interface AdminStats {
  total_users: number
  total_companies: number
  total_es: number
  total_ob: number
  users: UserStat[]
}

export default function AdminPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [sortKey, setSortKey] = useState<keyof UserStat>('created_at')
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const email = session?.user?.email

      if (!email) {
        setErrorMsg('ログインしていません')
        setLoading(false)
        return
      }
      if (email !== ADMIN_EMAIL) {
        setErrorMsg(`このアカウント（${email}）は管理者ではありません`)
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_admin_stats')
      if (error) {
        setErrorMsg(`SQL関数エラー: ${error.message}`)
      } else if (!data) {
        setErrorMsg('データが取得できませんでした')
      } else {
        setStats(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p className="text-gray-400 p-8">読み込み中...</p>

  if (errorMsg) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-gray-500 mb-2">エラー</p>
        <p className="text-sm text-red-400 bg-red-50 px-4 py-2 rounded-lg inline-block">{errorMsg}</p>
        <p className="text-xs text-gray-400 mt-4">
          ※ SQL未実行の場合は ob-admin-sql.sql を Supabase で実行してください
        </p>
      </div>
    )
  }

  const sorted = [...(stats?.users ?? [])].sort((a, b) => {
    const av = a[sortKey] ?? 0
    const bv = b[sortKey] ?? 0
    if (av < bv) return sortDesc ? 1 : -1
    if (av > bv) return sortDesc ? -1 : 1
    return 0
  })

  const handleSort = (key: keyof UserStat) => {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(true) }
  }

  const SortBtn = ({ k, label }: { k: keyof UserStat; label: string }) => (
    <th
      className="text-center px-3 py-3 text-xs text-gray-500 font-medium cursor-pointer hover:text-gray-700 select-none"
      onClick={() => handleSort(k)}
    >
      {label} {sortKey === k ? (sortDesc ? '▼' : '▲') : ''}
    </th>
  )

  const fmt = (d: string) => d ? new Date(d).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }) : '-'
  const fmtFull = (d: string) => d ? new Date(d).toLocaleDateString('ja-JP') : '-'

  const activeUsers = stats?.users.filter(u => u.company_count > 0 || u.es_count > 0).length ?? 0

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-medium">Admin Only</span>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">登録ユーザー数</p>
          <p className="text-3xl font-bold text-blue-600">{stats?.total_users ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p className="text-xs text-gray-500 mb-1">アクティブユーザー</p>
          <p className="text-3xl font-bold text-green-600">{activeUsers}</p>
          <p className="text-xs text-gray-400">何か登録した人</p>
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

      {/* ユーザー一覧テーブル */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">ユーザー一覧 ({stats?.users.length ?? 0}人)</h2>
          <p className="text-xs text-gray-400">カラムをクリックでソート</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">メールアドレス</th>
                <SortBtn k="company_count" label="企業" />
                <SortBtn k="es_count" label="ES" />
                <SortBtn k="interview_count" label="面接" />
                <SortBtn k="ob_count" label="OB訪問" />
                <SortBtn k="research_count" label="企業研究" />
                <SortBtn k="template_count" label="テンプレ" />
                <SortBtn k="created_at" label="登録日" />
                <SortBtn k="last_sign_in_at" label="最終ログイン" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((u, i) => {
                const totalContent = u.company_count + u.es_count + u.interview_count + u.ob_count + u.research_count
                return (
                  <tr key={i} className={`hover:bg-gray-50 ${totalContent === 0 ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-gray-700 text-xs max-w-[200px] truncate">
                      {u.email}
                      {totalContent === 0 && <span className="ml-1 text-gray-300 text-xs">（未使用）</span>}
                    </td>
                    <td className="px-3 py-3 text-center text-gray-700 font-medium">{u.company_count || '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{u.es_count || '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{u.interview_count || '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{u.ob_count || '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{u.research_count || '-'}</td>
                    <td className="px-3 py-3 text-center text-gray-600">{u.template_count || '-'}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs">{fmtFull(u.created_at)}</td>
                    <td className="px-3 py-3 text-gray-400 text-xs">{u.last_sign_in_at ? fmt(u.last_sign_in_at) : '未'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center">このページはあなた以外には表示されません</p>
    </div>
  )
}
