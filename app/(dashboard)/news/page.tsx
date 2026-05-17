'use client'

import { useEffect, useState } from 'react'

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

const RSS_FEEDS = [
  { url: 'https://rss.itmedia.co.jp/rss/2.0/news_bursts.xml', source: 'ITmedia' },
  { url: 'https://news.livedoor.com/topics/rss/job.xml', source: 'livedoor就活' },
  { url: 'https://feeds.dailyshincho.jp/dailyshincho', source: '就活情報' },
]

const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url='

const KEYWORD_FEEDS = [
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=%E5%B0%B1%E6%B4%BB%EF%BC%882026%EF%BC%89&hl=ja&gl=JP&ceid=JP:ja', source: 'Google News: 就活2026' },
  { url: 'https://api.rss2json.com/v1/api.json?rss_url=https://news.google.com/rss/search?q=%E6%96%B0%E5%8D%92%E6%8E%A1%E7%94%A8%E3%80%80%E5%8B%95%E5%90%91&hl=ja&gl=JP&ceid=JP:ja', source: 'Google News: 新卒採用' },
]

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const results: NewsItem[] = []
        await Promise.all(
          KEYWORD_FEEDS.map(async feed => {
            try {
              const res = await fetch(feed.url)
              const data = await res.json()
              if (data.items) {
                data.items.slice(0, 10).forEach((item: { title: string; link: string; pubDate: string }) => {
                  results.push({
                    title: item.title,
                    link: item.link,
                    pubDate: item.pubDate,
                    source: feed.source,
                  })
                })
              }
            } catch {}
          })
        )
        results.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        setNews(results)
      } catch {
        setError('ニュースの取得に失敗しました')
      }
      setLoading(false)
    }
    fetchNews()
  }, [])

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
      <p className="text-sm text-gray-400 mb-6">Google Newsから就活・新卒採用関連の最新情報を表示しています</p>

      {loading && <p className="text-gray-400">ニュースを取得中...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      {!loading && news.length === 0 && !error && (
        <p className="text-gray-400 text-sm">ニュースが見つかりませんでした</p>
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
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{item.source}</span>
                  {item.pubDate && <span className="text-xs text-gray-400">{formatDate(item.pubDate)}</span>}
                </div>
              </div>
              <span className="text-gray-300 text-sm shrink-0">→</span>
            </div>
          </a>
        ))}
      </div>

      {/* 就活系サイトへのリンク */}
      <div className="mt-8 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">就活関連サイト</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { name: 'マイナビ2026', url: 'https://job.mynavi.jp/' },
            { name: 'リクナビ2026', url: 'https://job.rikunabi.com/' },
            { name: 'ONE CAREER', url: 'https://www.onecareer.jp/' },
            { name: 'Wantedly', url: 'https://www.wantedly.com/' },
            { name: 'OpenWork', url: 'https://www.openwork.jp/' },
            { name: '就活会議', url: 'https://syukatsukaigi.jp/' },
          ].map(site => (
            <a key={site.name} href={site.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline bg-blue-50 px-3 py-2 rounded-lg text-center">
              {site.name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
