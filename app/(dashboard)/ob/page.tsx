'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { OBVisit, Company } from '@/lib/types'

function OBContent() {
  const searchParams = useSearchParams()
  const preselectedCompany = searchParams.get('company')

  const [visits, setVisits] = useState<OBVisit[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    company_id: preselectedCompany ?? '',
    visit_date: '',
    visitor_name: '',
    visitor_department: '',
    questions_and_answers: '',
    impression: '',
  })
  const [saving, setSaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState(preselectedCompany ?? 'すべて')

  const load = async () => {
    const supabase = createClient()
    const [{ data: ob }, { data: co }] = await Promise.all([
      supabase.from('ob_visits').select('*, company:companies(name)').order('visit_date', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setVisits(ob ?? [])
    setCompanies(co ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({
    company_id: preselectedCompany ?? '',
    visit_date: '',
    visitor_name: '',
    visitor_department: '',
    questions_and_answers: '',
    impression: '',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id,
      company_id: form.company_id || null,
      visit_date: form.visit_date || null,
      visitor_name: form.visitor_name || null,
      visitor_department: form.visitor_department || null,
      questions_and_answers: form.questions_and_answers,
      impression: form.impression || null,
    }
    if (editingId) {
      await supabase.from('ob_visits').update(payload).eq('id', editingId)
    } else {
      await supabase.from('ob_visits').insert(payload)
    }
    resetForm()
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (v: OBVisit) => {
    setForm({
      company_id: v.company_id ?? '',
      visit_date: v.visit_date ?? '',
      visitor_name: v.visitor_name ?? '',
      visitor_department: v.visitor_department ?? '',
      questions_and_answers: v.questions_and_answers,
      impression: v.impression ?? '',
    })
    setEditingId(v.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このOB訪問メモを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('ob_visits').delete().eq('id', id)
    load()
  }

  const filtered = filterCompany === 'すべて'
    ? visits
    : visits.filter(v => v.company_id === filterCompany)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">OB・OG訪問メモ</h1>
          <p className="text-sm text-gray-400 mt-0.5">OB訪問で聞いたこと・感じたことを記録</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm() }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + 訪問メモ追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? 'OB訪問メモ編集' : '新しいOB訪問メモ'}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">企業</label>
              <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">企業を選択（任意）</option>
                {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">訪問日</label>
              <input type="date" value={form.visit_date} onChange={e => setForm(p => ({ ...p, visit_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500">OBの名前（任意）</label>
              <input value={form.visitor_name} onChange={e => setForm(p => ({ ...p, visitor_name: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="田中さん" />
            </div>
            <div>
              <label className="text-xs text-gray-500">部署・職種（任意）</label>
              <input value={form.visitor_department} onChange={e => setForm(p => ({ ...p, visitor_department: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="営業部 / エンジニア" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500">質問と回答 *</label>
            <textarea value={form.questions_and_answers} onChange={e => setForm(p => ({ ...p, questions_and_answers: e.target.value }))} required
              rows={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Q: 仕事のやりがいは何ですか？\nA: ...\n\nQ: 就活生へのアドバイスは？\nA: ...`} />
          </div>

          <div>
            <label className="text-xs text-gray-500">感想・印象</label>
            <textarea value={form.impression} onChange={e => setForm(p => ({ ...p, impression: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="訪問を通じて感じたこと、企業への印象の変化など" />
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

      {/* 企業フィルター */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setFilterCompany('すべて')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterCompany === 'すべて' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
          すべて
        </button>
        {companies.filter(co => visits.some(v => v.company_id === co.id)).map(co => (
          <button key={co.id} onClick={() => setFilterCompany(co.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterCompany === co.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {co.name}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">読み込み中...</p> : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">OB訪問メモがありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {v.company_id && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {(v.company as unknown as { name: string })?.name ?? '企業'}
                    </span>
                  )}
                  {v.visitor_name && (
                    <span className="text-xs text-gray-600 font-medium">👤 {v.visitor_name}</span>
                  )}
                  {v.visitor_department && (
                    <span className="text-xs text-gray-400">{v.visitor_department}</span>
                  )}
                  {v.visit_date && (
                    <span className="text-xs text-gray-400">
                      {new Date(v.visit_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(v)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(v.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-2">
                <p className="text-xs text-gray-400 mb-1 font-medium">質問と回答</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.questions_and_answers || '（未記入）'}</p>
              </div>

              {v.impression && (
                <div className="bg-yellow-50 rounded-lg p-3">
                  <p className="text-xs text-yellow-600 mb-1 font-medium">感想・印象</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{v.impression}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function OBPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">読み込み中...</p>}>
      <OBContent />
    </Suspense>
  )
}
