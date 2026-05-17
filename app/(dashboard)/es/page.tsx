'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ESEntry, Company } from '@/lib/types'

function ESContent() {
  const searchParams = useSearchParams()
  const preselectedCompany = searchParams.get('company')

  const [entries, setEntries] = useState<ESEntry[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' })
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState(preselectedCompany ?? 'すべて')

  const load = async () => {
    const supabase = createClient()
    const [{ data: es }, { data: co }] = await Promise.all([
      supabase.from('es_entries').select('*, company:companies(name)').order('created_at', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setEntries(es ?? [])
    setCompanies(co ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id,
      company_id: form.company_id,
      question: form.question,
      answer: form.answer,
      max_chars: form.max_chars ? parseInt(form.max_chars) : null,
    }
    if (editingId) {
      await supabase.from('es_entries').update(payload).eq('id', editingId)
    } else {
      await supabase.from('es_entries').insert(payload)
    }
    setForm({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' })
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (entry: ESEntry) => {
    setForm({ company_id: entry.company_id, question: entry.question, answer: entry.answer, max_chars: entry.max_chars?.toString() ?? '' })
    setEditingId(entry.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このESを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('es_entries').delete().eq('id', id)
    load()
  }

  const filtered = filterCompany === 'すべて' ? entries : entries.filter(e => e.company_id === filterCompany)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">ES管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + ES追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? 'ES編集' : '新しいES'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">企業 *</label>
              <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択してください</option>
                {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">文字数制限</label>
              <input type="number" value={form.max_chars} onChange={e => setForm(p => ({ ...p, max_chars: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">設問 *</label>
            <input value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="学生時代に頑張ったことを教えてください" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500">回答</label>
              {form.max_chars && <span className={`text-xs ${form.answer.length > parseInt(form.max_chars) ? 'text-red-500' : 'text-gray-400'}`}>
                {form.answer.length} / {form.max_chars}文字
              </span>}
            </div>
            <textarea value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="回答を入力..." />
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
        <p className="text-gray-400 text-sm">ESがありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(entry => (
            <div key={entry.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {(entry.company as unknown as { name: string })?.name ?? '不明'}
                  </span>
                  {entry.max_chars && <span className="ml-2 text-xs text-gray-400">{entry.max_chars}文字以内</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(entry)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(entry.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
              <p className="text-sm font-medium text-gray-800 mb-2">Q: {entry.question}</p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{entry.answer || '（未記入）'}</p>
              {entry.max_chars && (
                <p className={`text-xs mt-1 text-right ${entry.answer.length > entry.max_chars ? 'text-red-500' : 'text-gray-400'}`}>
                  {entry.answer.length} / {entry.max_chars}文字
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ESPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
      <ESContent />
    </Suspense>
  )
}
