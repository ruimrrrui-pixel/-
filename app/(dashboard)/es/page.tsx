'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ESEntry, Template, Company } from '@/lib/types'

const TEMPLATE_TYPES = [
  { value: 'self_pr', label: '自己PR' },
  { value: 'motivation', label: '志望動機' },
  { value: 'other', label: 'その他' },
]

function ESContent() {
  const searchParams = useSearchParams()
  const preselectedCompany = searchParams.get('company')

  const [tab, setTab] = useState<'template' | 'es'>('template')

  // --- テンプレート state ---
  const [templates, setTemplates] = useState<Template[]>([])
  const [tLoading, setTLoading] = useState(true)
  const [tShowForm, setTShowForm] = useState(false)
  const [tEditingId, setTEditingId] = useState<string | null>(null)
  const [tForm, setTForm] = useState({ type: 'self_pr', title: '', content: '' })
  const [tSaving, setTSaving] = useState(false)
  const [tFilterType, setTFilterType] = useState('すべて')

  // --- ES state ---
  const [entries, setEntries] = useState<ESEntry[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [eLoading, setELoading] = useState(true)
  const [eShowForm, setEShowForm] = useState(false)
  const [eEditingId, setEEditingId] = useState<string | null>(null)
  const [eForm, setEForm] = useState({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' })
  const [eSaving, setESaving] = useState(false)
  const [filterCompany, setFilterCompany] = useState(preselectedCompany ?? 'すべて')

  const loadTemplates = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('templates').select('*').order('updated_at', { ascending: false })
    setTemplates(data ?? [])
    setTLoading(false)
  }

  const loadES = async () => {
    const supabase = createClient()
    const [{ data: es }, { data: co }] = await Promise.all([
      supabase.from('es_entries').select('*, company:companies(name)').order('created_at', { ascending: false }),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setEntries(es ?? [])
    setCompanies(co ?? [])
    setELoading(false)
  }

  useEffect(() => {
    loadTemplates()
    loadES()
    if (preselectedCompany) setTab('es')
  }, [preselectedCompany])

  // --- テンプレート操作 ---
  const handleTSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setTSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (tEditingId) {
      await supabase.from('templates').update(tForm).eq('id', tEditingId)
    } else {
      await supabase.from('templates').insert({ ...tForm, user_id: user!.id })
    }
    setTForm({ type: 'self_pr', title: '', content: '' })
    setTShowForm(false)
    setTEditingId(null)
    setTSaving(false)
    loadTemplates()
  }

  const startTEdit = (t: Template) => {
    setTForm({ type: t.type, title: t.title, content: t.content })
    setTEditingId(t.id)
    setTShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('templates').delete().eq('id', id)
    loadTemplates()
  }

  // --- ES操作 ---
  const handleESave = async (e: React.FormEvent) => {
    e.preventDefault()
    setESaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id,
      company_id: eForm.company_id,
      question: eForm.question,
      answer: eForm.answer,
      max_chars: eForm.max_chars ? parseInt(eForm.max_chars) : null,
    }
    if (eEditingId) {
      await supabase.from('es_entries').update(payload).eq('id', eEditingId)
    } else {
      await supabase.from('es_entries').insert(payload)
    }
    setEForm({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' })
    setEShowForm(false)
    setEEditingId(null)
    setESaving(false)
    loadES()
  }

  const startEEdit = (entry: ESEntry) => {
    setEForm({ company_id: entry.company_id, question: entry.question, answer: entry.answer, max_chars: entry.max_chars?.toString() ?? '' })
    setEEditingId(entry.id)
    setEShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleEDelete = async (id: string) => {
    if (!confirm('このESを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('es_entries').delete().eq('id', id)
    loadES()
  }

  const tFiltered = tFilterType === 'すべて' ? templates : templates.filter(t => t.type === tFilterType)
  const eFiltered = filterCompany === 'すべて' ? entries : entries.filter(e => e.company_id === filterCompany)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ES・テンプレート管理</h1>

      {/* タブ */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('template')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'template' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📋 テンプレート
        </button>
        <button
          onClick={() => setTab('es')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab === 'es' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          📝 ES管理
        </button>
      </div>

      {/* ========== テンプレートタブ ========== */}
      {tab === 'template' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">自己PR・志望動機のテンプレートを管理</p>
            <button
              onClick={() => { setTShowForm(!tShowForm); setTEditingId(null); setTForm({ type: 'self_pr', title: '', content: '' }) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + テンプレート追加
            </button>
          </div>

          {tShowForm && (
            <form onSubmit={handleTSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
              <h2 className="font-semibold text-gray-700">{tEditingId ? 'テンプレート編集' : '新しいテンプレート'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">種類</label>
                  <select value={tForm.type} onChange={e => setTForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">タイトル *</label>
                  <input value={tForm.title} onChange={e => setTForm(p => ({ ...p, title: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: IT業界向け自己PR" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">内容</label>
                <textarea value={tForm.content} onChange={e => setTForm(p => ({ ...p, content: e.target.value }))} rows={10}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="テンプレート内容を入力..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={tSaving} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {tSaving ? '保存中...' : '保存'}
                </button>
                <button type="button" onClick={() => { setTShowForm(false); setTEditingId(null) }}
                  className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600">
                  キャンセル
                </button>
              </div>
            </form>
          )}

          <div className="flex gap-2 mb-4">
            {['すべて', ...TEMPLATE_TYPES.map(t => t.value)].map(v => (
              <button key={v} onClick={() => setTFilterType(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${tFilterType === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                {TEMPLATE_TYPES.find(t => t.value === v)?.label ?? 'すべて'}
              </button>
            ))}
          </div>

          {tLoading ? <p className="text-gray-400">読み込み中...</p> : tFiltered.length === 0 ? (
            <p className="text-gray-400 text-sm">テンプレートがありません</p>
          ) : (
            <div className="space-y-4">
              {tFiltered.map(t => (
                <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                        {TEMPLATE_TYPES.find(tp => tp.value === t.type)?.label}
                      </span>
                      <h3 className="font-medium text-gray-800">{t.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startTEdit(t)} className="text-xs text-blue-500 hover:underline">編集</button>
                      <button onClick={() => handleTDelete(t.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">{t.content}</p>
                  <p className="text-xs text-gray-400 mt-1 text-right">{t.content.length}文字</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========== ES管理タブ ========== */}
      {tab === 'es' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">企業別にESの設問と回答を管理</p>
            <button
              onClick={() => { setEShowForm(!eShowForm); setEEditingId(null); setEForm({ company_id: preselectedCompany ?? '', question: '', answer: '', max_chars: '' }) }}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + ES追加
            </button>
          </div>

          {eShowForm && (
            <form onSubmit={handleESave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
              <h2 className="font-semibold text-gray-700">{eEditingId ? 'ES編集' : '新しいES'}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">企業 *</label>
                  <select value={eForm.company_id} onChange={e => setEForm(p => ({ ...p, company_id: e.target.value }))} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">選択してください</option>
                    {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">文字数制限</label>
                  <input type="number" value={eForm.max_chars} onChange={e => setEForm(p => ({ ...p, max_chars: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 400" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500">設問 *</label>
                <input value={eForm.question} onChange={e => setEForm(p => ({ ...p, question: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="学生時代に頑張ったことを教えてください" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500">回答</label>
                  {eForm.max_chars && <span className={`text-xs ${eForm.answer.length > parseInt(eForm.max_chars) ? 'text-red-500' : 'text-gray-400'}`}>
                    {eForm.answer.length} / {eForm.max_chars}文字
                  </span>}
                </div>
                <textarea value={eForm.answer} onChange={e => setEForm(p => ({ ...p, answer: e.target.value }))} rows={8}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="回答を入力..." />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={eSaving} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                  {eSaving ? '保存中...' : '保存'}
                </button>
                <button type="button" onClick={() => { setEShowForm(false); setEEditingId(null) }}
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

          {eLoading ? <p className="text-gray-400">読み込み中...</p> : eFiltered.length === 0 ? (
            <p className="text-gray-400 text-sm">ESがありません</p>
          ) : (
            <div className="space-y-4">
              {eFiltered.map(entry => (
                <div key={entry.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {(entry.company as unknown as { name: string })?.name ?? '不明'}
                      </span>
                      {entry.max_chars && <span className="ml-2 text-xs text-gray-400">{entry.max_chars}文字以内</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEEdit(entry)} className="text-xs text-blue-500 hover:underline">編集</button>
                      <button onClick={() => handleEDelete(entry.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
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
