'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Company, CompanyStatus } from '@/lib/types'

const STATUSES: CompanyStatus[] = ['気になる', '応募済み', 'ES提出', '面接中', '内定', '不合格', '辞退']

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [company, setCompany] = useState<Company | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', industry: '', status: '気になる' as CompanyStatus, website: '', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('companies').select('*').eq('id', id).single()
      if (data) {
        setCompany(data)
        setForm({ name: data.name, industry: data.industry ?? '', status: data.status, website: data.website ?? '', note: data.note ?? '' })
      }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('companies').update(form).eq('id', id)
    setCompany(prev => prev ? { ...prev, ...form } : null)
    setEditing(false)
    setSaving(false)
  }

  if (!company) return <p className="text-gray-400">読み込み中...</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link href="/companies" className="text-sm text-gray-400 hover:text-gray-600">← 企業一覧</Link>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        {editing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500">企業名</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500">業界</label>
                <input value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500">ステータス</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as CompanyStatus }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Webサイト</label>
                <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">メモ</label>
              <textarea value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600">
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-800">{company.name}</h1>
                {company.industry && <p className="text-sm text-gray-500 mt-0.5">{company.industry}</p>}
              </div>
              <button onClick={() => setEditing(true)} className="text-sm text-blue-600 hover:underline">編集</button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              <span>ステータス: <strong>{company.status}</strong></span>
              {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Webサイト</a>}
            </div>
            {company.note && <p className="mt-3 text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{company.note}</p>}
          </div>
        )}
      </div>

      {/* 関連ページへのリンク */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href={`/es?company=${id}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="text-xl mb-1">📝</div>
          <p className="text-sm font-medium text-gray-700">ESを管理</p>
        </Link>
        <Link href={`/interviews?company=${id}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="text-xl mb-1">🎤</div>
          <p className="text-sm font-medium text-gray-700">面接メモ</p>
        </Link>
        <Link href={`/research?company=${id}`} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-center">
          <div className="text-xl mb-1">🔍</div>
          <p className="text-sm font-medium text-gray-700">企業研究メモ</p>
        </Link>
      </div>
    </div>
  )
}
