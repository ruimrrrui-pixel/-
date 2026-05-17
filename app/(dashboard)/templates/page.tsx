'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Template } from '@/lib/types'

const TYPES = [
  { value: 'self_pr', label: '自己PR' },
  { value: 'motivation', label: '志望動機' },
  { value: 'other', label: 'その他' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ type: 'self_pr', title: '', content: '' })
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState('すべて')

  const load = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('templates').select('*').order('updated_at', { ascending: false })
    setTemplates(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (editingId) {
      await supabase.from('templates').update(form).eq('id', editingId)
    } else {
      await supabase.from('templates').insert({ ...form, user_id: user!.id })
    }
    setForm({ type: 'self_pr', title: '', content: '' })
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (t: Template) => {
    setForm({ type: t.type, title: t.title, content: t.content })
    setEditingId(t.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return
    const supabase = createClient()
    await supabase.from('templates').delete().eq('id', id)
    load()
  }

  const filtered = filterType === 'すべて' ? templates : templates.filter(t => t.type === filterType)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">テンプレート管理</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ type: 'self_pr', title: '', content: '' }) }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          + テンプレート追加
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? 'テンプレート編集' : '新しいテンプレート'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">種類</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">タイトル *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: IT業界向け自己PR" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">内容</label>
            <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="テンプレート内容を入力..." />
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
      <div className="flex gap-2 mb-4">
        {['すべて', ...TYPES.map(t => t.value)].map(v => (
          <button key={v} onClick={() => setFilterType(v)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition ${filterType === v ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
            {TYPES.find(t => t.value === v)?.label ?? 'すべて'}
          </button>
        ))}
      </div>

      {loading ? <p className="text-gray-400">読み込み中...</p> : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">テンプレートがありません</p>
      ) : (
        <div className="space-y-4">
          {filtered.map(t => (
            <div key={t.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    {TYPES.find(tp => tp.value === t.type)?.label}
                  </span>
                  <h3 className="font-medium text-gray-800">{t.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(t)} className="text-xs text-blue-500 hover:underline">編集</button>
                  <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                </div>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">{t.content}</p>
              <p className="text-xs text-gray-400 mt-1 text-right">{t.content.length}文字</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
