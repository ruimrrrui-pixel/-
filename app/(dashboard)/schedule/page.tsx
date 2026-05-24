'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Company } from '@/lib/types'

const EVENT_TYPES = [
  { value: '面接',       label: '面接',       color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  { value: 'ES締め切り', label: 'ES締め切り', color: 'bg-red-100 text-red-600',      dot: 'bg-red-400' },
  { value: '会社説明会', label: '会社説明会', color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400' },
  { value: 'OB・OG訪問', label: 'OB・OG訪問', color: 'bg-teal-100 text-teal-700',   dot: 'bg-teal-400' },
  { value: 'その他',     label: 'その他',     color: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
]

interface Schedule {
  id: string
  user_id: string
  company_id: string | null
  title: string
  event_type: string
  event_date: string
  event_time: string | null
  note: string | null
  created_at: string
  company?: { name: string }
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

function getEventStyle(type: string) {
  return EVENT_TYPES.find(e => e.value === type) ?? EVENT_TYPES[4]
}

export default function SchedulePage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    event_type: '面接',
    event_date: '',
    event_time: '',
    company_id: '',
    note: '',
  })

  const load = async () => {
    const supabase = createClient()
    const [{ data: sc }, { data: co }] = await Promise.all([
      supabase.from('schedules').select('*, company:companies(name)').order('event_date').order('event_time'),
      supabase.from('companies').select('id, name').order('name'),
    ])
    setSchedules(sc ?? [])
    setCompanies(co ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ title: '', event_type: '面接', event_date: '', event_time: '', company_id: '', note: '' })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const payload = {
      user_id: user!.id,
      title: form.title,
      event_type: form.event_type,
      event_date: form.event_date,
      event_time: form.event_time || null,
      company_id: form.company_id || null,
      note: form.note || null,
    }
    if (editingId) {
      await supabase.from('schedules').update(payload).eq('id', editingId)
    } else {
      await supabase.from('schedules').insert(payload)
    }
    resetForm()
    setShowForm(false)
    setEditingId(null)
    setSaving(false)
    load()
  }

  const startEdit = (s: Schedule) => {
    setForm({
      title: s.title,
      event_type: s.event_type,
      event_date: s.event_date,
      event_time: s.event_time ?? '',
      company_id: s.company_id ?? '',
      note: s.note ?? '',
    })
    setEditingId(s.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この予定を削除しますか？')) return
    const supabase = createClient()
    await supabase.from('schedules').delete().eq('id', id)
    load()
  }

  // ---- カレンダー計算 ----
  const firstDay = new Date(year, month, 1).getDay() // 0=日
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const eventsByDate = useMemo(() => {
    const map: Record<string, Schedule[]> = {}
    schedules.forEach(s => {
      if (!map[s.event_date]) map[s.event_date] = []
      map[s.event_date].push(s)
    })
    return map
  }, [schedules])

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const displayedSchedules = useMemo(() => {
    if (selectedDate) return schedules.filter(s => s.event_date === selectedDate)
    // 今日以降の予定（直近30件）
    return schedules.filter(s => s.event_date >= todayStr).slice(0, 30)
  }, [schedules, selectedDate, todayStr])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' })
  }

  const formatTime = (timeStr: string) => timeStr?.slice(0, 5) ?? ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">日程管理</h1>
          <p className="text-sm text-gray-400 mt-0.5">面接・締め切り・説明会の日程を管理</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); resetForm() }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          + 予定を追加
        </button>
      </div>

      {/* 追加・編集フォーム */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6 space-y-3">
          <h2 className="font-semibold text-gray-700">{editingId ? '予定を編集' : '新しい予定'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">タイトル *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="〇〇社 一次面接" />
            </div>
            <div>
              <label className="text-xs text-gray-500">種類</label>
              <select value={form.event_type} onChange={e => setForm(p => ({ ...p, event_type: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">日付 *</label>
              <input type="date" value={form.event_date} onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))} required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500">時間（任意）</label>
              <input type="time" value={form.event_time} onChange={e => setForm(p => ({ ...p, event_time: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs text-gray-500">企業（任意）</label>
              <select value={form.company_id} onChange={e => setForm(p => ({ ...p, company_id: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">選択しない</option>
                {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">メモ（任意）</label>
              <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="場所・持ち物など" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ---- カレンダー ---- */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">‹</button>
            <h2 className="text-sm font-semibold text-gray-700">{year}年 {month + 1}月</h2>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">›</button>
          </div>
          {/* 曜日 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-center text-xs font-medium py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>
          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const dayEvents = eventsByDate[dateStr] ?? []
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const dow = (firstDay + i) % 7
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={`relative flex flex-col items-center py-1 rounded-lg transition ${isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-50'}`}
                >
                  <span className={`text-xs ${!isSelected && !isToday && dow === 0 ? 'text-red-400' : !isSelected && !isToday && dow === 6 ? 'text-blue-400' : ''}`}>{day}</span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <span key={idx} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : getEventStyle(ev.event_type).dot}`} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          {/* 凡例 */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
            {EVENT_TYPES.map(t => (
              <div key={t.value} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                <span className="text-xs text-gray-500">{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- 予定リスト ---- */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedDate ? `${formatDate(selectedDate)}の予定` : '直近の予定'}
            </h2>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-xs text-blue-500 hover:underline">すべて表示</button>
            )}
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm">読み込み中...</p>
          ) : displayedSchedules.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-sm">{selectedDate ? 'この日の予定はありません' : '直近の予定はありません'}</p>
              <button onClick={() => {
                setShowForm(true)
                if (selectedDate) setForm(f => ({ ...f, event_date: selectedDate }))
              }} className="mt-3 text-xs text-blue-500 hover:underline">+ 予定を追加</button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedSchedules.map(s => {
                const style = getEventStyle(s.event_type)
                const isPast = s.event_date < todayStr
                return (
                  <div key={s.id} className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 ${isPast ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${style.color}`}>{s.event_type}</span>
                          {s.company && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{(s.company as unknown as { name: string }).name}</span>}
                        </div>
                        <p className="font-medium text-gray-800 text-sm">{s.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500">📅 {formatDate(s.event_date)}</span>
                          {s.event_time && <span className="text-xs text-gray-500">🕐 {formatTime(s.event_time)}</span>}
                        </div>
                        {s.note && <p className="text-xs text-gray-400 mt-1">📝 {s.note}</p>}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(s)} className="text-xs text-blue-500 hover:underline">編集</button>
                        <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-600">削除</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
