'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ResearchMemo, Company } from '@/lib/types'

function ResearchContent() {
  const searchParams = useSearchParams()
  const preselectedCompany = searchParams.get('company')

  const [memos, setMemos] = useState<ResearchMemo[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ company_id: preselectedCompany ?? '', content: '' })
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState(preselectedCompany ?? 'すべて')

  const load = async () => {
    const supabase = createClient()
    const [{ data: rm }, { data: co }] = await Promise.all([
      supabase.from('research_memos').select('*, company:companies(name)').order('updated_at', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setMemos(rm ?? [])
    setCompanies(co ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editingId) {
      await supabase.from('research_memos').update(form).eq('id', editingId)
    } else {
      await supabase.from('research_memos').insert({ ...form, user_id: user!.id })
    }
    setForm({ company_id: preselectedCompany ?? '', content: '' })
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (m: ResearchMemo) => {
    setForm({ company_id: m.company_id, content: m.content })
    setEditingId(m.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この企業研究メモを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('research_memos').delete().eq('id', id)
    load()
  }

  const filtered = filterCompany === 'すべて' ? memos : memos.filter(m => m.company_id === filterCompany)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">企業研究メモ</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ company_id: preselectedCompany ?? '', content: '' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + メモ追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? 'メモ編集' : '新しい企業研究メモ'}</h2>
          <div>
            <label className="text-xs text-gray-500">企業 *</label>
            <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">選択してください</option>
              {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">メモ内容</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={12}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="事業内容、企業理念、強み・弱み、気になった点など自由に記入..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
              {saving ? '保存中...' : '保存'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null) }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {/* フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterCompany('すべて')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterCompany === 'すべて' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          すべて
        </button>
        {companies.map(co => (
          <button key={co.id} onClick={() => setFilterCompany(co.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterCompany === co.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {co.name}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">読み込み中...</p> : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">企業研究メモがありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded">
                  {(m.company as unknown as { name: string })?.name ?? '不明'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(m)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
      <ResearchContent />
    </Suspense>
  )
}
