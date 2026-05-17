'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Company, CompanyStatus, SelectionType } from '@/lib/types'

const STATUSES: CompanyStatus[] = ['気になる', '応募済み', 'ES提出', '面接中', '内定（合格）', '不合格', '辞退']
const SELECTION_TYPES: SelectionType[] = ['本選考', 'インターン']

const STATUS_COLORS: Record<string, string> = {
  '気になる': 'bg-gray-100 text-gray-700',
  '応募済み': 'bg-blue-100 text-blue-700',
  'ES提出': 'bg-yellow-100 text-yellow-700',
  '面接中': 'bg-orange-100 text-orange-700',
  '内定（合格）': 'bg-green-100 text-green-700',
  '不合格': 'bg-red-100 text-red-700',
  '辞退': 'bg-gray-100 text-gray-500',
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [status, setStatus] = useState<CompanyStatus>('気になる')
  const [selectionType, setSelectionType] = useState<SelectionType>('本選考')
  const [website, setWebsite] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('すべて')
  const [filterType, setFilterType] = useState<string>('すべて')

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false })
    setCompanies(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('companies').insert({
      user_id: user!.id, name, industry, status,
      selection_type: selectionType, website
    })
    setName(''); setIndustry(''); setStatus('気になる'); setSelectionType('本選考'); setWebsite('')
    setShowForm(false)
    setSaving(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この企業を削除しますか？（関連するES・メモもすべて削除されます）')) return
    const supabase = createClient()
    await supabase.from('companies').delete().eq('id', id)
    load()
  }

  const filtered = companies
    .filter(c => filterStatus === 'すべて' || c.status === filterStatus)
    .filter(c => filterType === 'すべて' || c.selection_type === filterType)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">企業管理</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + 企業を追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700 mb-2">新しい企業</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">企業名 *</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="株式会社○○" />
            </div>
            <div>
              <label className="text-xs text-gray-500">業界</label>
              <input value={industry} onChange={e => setIndustry(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="IT・商社・金融など" />
            </div>
            <div>
              <label className="text-xs text-gray-500">種別</label>
              <select value={selectionType} onChange={e => setSelectionType(e.target.value as SelectionType)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SELECTION_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">ステータス</label>
              <select value={status} onChange={e => setStatus(e.target.value as CompanyStatus)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500">Webサイト</label>
              <input value={website} onChange={e => setWebsite(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..." />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* 種別フィルター */}
      <div className="flex gap-2 mb-3">
        {['すべて', ...SELECTION_TYPES].map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterType === t ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ステータスフィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['すべて', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterStatus === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* 企業一覧 */}
      {loading ? (
        <p className="text-gray-400">読み込み中...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">企業がありません</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(co => (
            <div key={co.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/companies/${co.id}`} className="font-medium text-gray-800 hover:text-blue-600 truncate">
                    {co.name}
                  </Link>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[co.status]}`}>
                    {co.status}
                  </span>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${co.selection_type === 'インターン' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
                    {co.selection_type ?? '本選考'}
                  </span>
                </div>
                {co.industry && <p className="text-xs text-gray-400 mt-0.5">{co.industry}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {co.website && (
                  <a href={co.website} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline">サイト</a>
                )}
                <Link href={`/companies/${co.id}`} className="text-xs text-gray-500 hover:text-gray-700">詳細</Link>
                <button onClick={() => handleDelete(co.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
