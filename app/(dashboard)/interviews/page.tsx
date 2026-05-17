'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { InterviewMemo, Company } from '@/lib/types'

function InterviewsContent() {
  const searchParams = useSearchParams()
  const preselectedCompany = searchParams.get('company')

  const [memos, setMemos] = useState<InterviewMemo[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ company_id: preselectedCompany ?? '', interview_date: '', round: '', questions_and_answers: '', reflection: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const supabase = createClient()
    const [{ data: im }, { data: co }] = await Promise.all([
      supabase.from('interview_memos').select('*, company:companies(name)').order('interview_date', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setMemos(im ?? [])
    setCompanies(co ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = { ...form, user_id: user!.id }
    if (editingId) {
      await supabase.from('interview_memos').update(payload).eq('id', editingId)
    } else {
      await supabase.from('interview_memos').insert(payload)
    }
    setForm({ company_id: preselectedCompany ?? '', interview_date: '', round: '', questions_and_answers: '', reflection: '' })
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (m: InterviewMemo) => {
    setForm({ company_id: m.company_id, interview_date: m.interview_date, round: m.round ?? '', questions_and_answers: m.questions_and_answers, reflection: m.reflection })
    setEditingId(m.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この面接メモを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('interview_memos').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">面接振り返りメモ</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ company_id: preselectedCompany ?? '', interview_date: '', round: '', questions_and_answers: '', reflection: '' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + メモ追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? 'メモ編集' : '新しい面接メモ'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500">企業 *</label>
              <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択</option>
                {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">面接日 *</label>
              <input type="date" value={form.interview_date} onChange={e => setForm(p => ({ ...p, interview_date: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500">選考フェーズ</label>
              <input value={form.round} onChange={e => setForm(p => ({ ...p, round: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="一次面接・最終面接など" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">質問と回答</label>
            <textarea value={form.questions_and_answers} onChange={e => setForm(p => ({ ...p, questions_and_answers: e.target.value }))} rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Q: 自己紹介をしてください&#10;A: ..." />
          </div>
          <div>
            <label className="text-xs text-gray-500">振り返り・反省点</label>
            <textarea value={form.reflection} onChange={e => setForm(p => ({ ...p, reflection: e.target.value }))} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="うまくいった点・改善点など" />
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

      {loading ? <p className="text-gray-400">読み込み中...</p> : memos.length === 0 ? (
        <p className="text-gray-400 text-sm">面接メモがありません</p>
      ) : (
        <div className="space-y-4">
          {memos.map(m => (
            <div key={m.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded mr-2">
                    {(m.company as unknown as { name: string })?.name ?? '不明'}
                  </span>
                  {m.round && <span className="text-xs text-gray-500">{m.round}</span>}
                  <p className="text-xs text-gray-400 mt-1">{m.interview_date}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(m)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
              {m.questions_and_answers && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">質問と回答</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">{m.questions_and_answers}</p>
                </div>
              )}
              {m.reflection && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">振り返り</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-yellow-50 rounded-lg p-3">{m.reflection}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
      <InterviewsContent />
    </Suspense>
  )
}
