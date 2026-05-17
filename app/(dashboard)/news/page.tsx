'use client'

import { useEffect, useState } from 'react'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

const INDUSTRIES = [
  { label: 'すべて', keyword: '就活 2026' },
  { label: 'IT・テック', keyword: 'IT 就活 エンジニア 採用 2026' },
  { label: '金融・銀行', keyword: '銀行 証券 就活 採用 2026' },
  { label: 'コンサル', keyword: 'コンサルティング 就活 採用 2026' },
  { label: 'メーカー', keyword: 'メーカー 製造 就活 採用 2026' },
  { label: '商社', keyword: '商社 就活 採用 2026' },
  { label: '広告・メディア', keyword: '広告 メディア 就活 採用 2026' },
  { label: '不動産', keyword: '不動産 就活 採用 2026' },
]

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIndustry, setSelectedIndustry] = useState(INDUSTRIES[0])
  const [keyword, setKeyword] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const fetchNews = async (query: string) => {
    setLoading(true)
    setNews([])
    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(`https://news.google.com/rss/search?q=${encodedQuery}&hl=ja&gl=JP&ceid=JP:ja`)}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.items) {
        const items: NewsItem[] = data.items.slice(0, 20).map((item: { title: string; link: string; pubDate: string }) => ({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          source: 'Google News',
        }))
        setNews(items)
      }
    } catch {
      setNews([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchNews(selectedIndustry.keyword)
  }, [selectedIndustry])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchKeyword.trim()) {
      fetchNews(`${searchKeyword} 就活`)
    }
  }

  const handleIndustrySelect = (industry: typeof INDUSTRIES[0]) => {
    setSelectedIndustry(industry)
    setSearchKeyword('')
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
    } catch {
      return ''
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">就活ニュース</h1>
      <p className="text-sm text-gray-400 mb-5">Google Newsから最新の就活情報を取得しています</p>

      {/* キーワード検索 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          value={searchKeyword}
          onChange={e => setSearchKeyword(e.target.value)}
          placeholder="キーワードで検索（例: 面接対策、ES、OB訪問）"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          検索
        </button>
      </form>

      {/* 業界フィルター */}
      <div className="flex flex-wrap gap-2 mb-6">
        {INDUSTRIES.map(ind => (
          <button
            key={ind.label}
            onClick={() => handleIndustrySelect(ind)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              selectedIndustry.label === ind.label && !searchKeyword
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {ind.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-10 text-gray-400">ニュースを取得中...</div>
      )}

      {!loading && news.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-10">ニュースが見つかりませんでした</p>
      )}

      <div className="space-y-3">
        {news.map((item, i) => (
          <a
            key={i}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 leading-snug hover:text-blue-600">{item.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  {item.pubDate && <span className="text-xs text-gray-400">{formatDate(item.pubDate)}</span>}
                </div>
              </div>
              <span className="text-gray-300 text-sm shrink-0">→</span>
            </div>
          </a>
        ))}
      </div>

      {/* 就活関連サイトへのリンク */}
      <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <p className="text-xs text-gray-400 mb-1">📌 就活関連サービスをまとめたページもあります</p>
        <a href="/links" className="text-sm text-blue-600 font-medium hover:underline">
          就活サービス一覧を見る →
        </a>
      </div>
    </div>
  )
}
