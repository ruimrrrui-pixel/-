'use client'

import { useEffect, useState } from 'react'

const ADS = [
  {
    name: 'キミスカ',
    desc: 'プロフィール登録だけで企業からスカウトが届く逆求人サービス',
    href: 'https://px.a8.net/svt/ejp?a8mat=4B1THZ+EU1XHU+24ZO+HV7V6',
    color: 'from-green-500 to-teal-500',
    icon: '📨',
    cta: 'スカウトを受け取る',
  },
  {
    name: 'Matcher',
    desc: '現役社会人にOB・OG訪問できるサービス（アプリ専用）',
    href: 'https://px.a8.net/svt/ejp?a8mat=4B1V1Y+8V4G42+5JSI+61C2P',
    color: 'from-blue-500 to-indigo-500',
    icon: '☕',
    cta: 'OB訪問してみる',
  },
  {
    name: 'ユメキャリ就職エージェント',
    desc: '大手現役人事による完全無料の就活サポート。ES添削・面接対策まで',
    href: 'https://px.a8.net/svt/ejp?a8mat=4B1V1Y+912S5U+5PWS+5Z6WX',
    color: 'from-orange-500 to-pink-500',
    icon: '🤝',
    cta: '無料で相談する',
  },
  {
    name: 'ONE CAREER',
    desc: '実際の選考フロー・通過ESが見られる就活情報プラットフォーム',
    href: 'https://px.a8.net/svt/ejp?a8mat=4B1THY+5URK0I+5O7E+5YZ75',
    color: 'from-purple-500 to-violet-500',
    icon: '📊',
    cta: '選考情報を見る',
  },
]

interface Props {
  compact?: boolean
}

export default function RotatingBanner({ compact = false }: Props) {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % ADS.length)
        setVisible(true)
      }, 400)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const ad = ADS[current]

  if (compact) {
    return (
      <a
        href={ad.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`block rounded-xl p-3 bg-gradient-to-r ${ad.color} text-white transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">{ad.icon}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{ad.name}</p>
              <p className="text-xs opacity-80 truncate">{ad.desc}</p>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-lg shrink-0 ml-2">{ad.cta}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-1">
            {ADS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1 bg-white/40'}`} />
            ))}
          </div>
          <span className="text-xs opacity-60">PR</span>
        </div>
      </a>
    )
  }

  return (
    <a
      href={ad.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl p-5 bg-gradient-to-r ${ad.color} text-white shadow-md hover:shadow-lg transition-all duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{ad.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-base">{ad.name}</p>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">PR</span>
          </div>
          <p className="text-sm opacity-90 leading-snug">{ad.desc}</p>
          <span className="inline-block mt-3 text-sm bg-white text-gray-800 font-semibold px-4 py-1.5 rounded-lg hover:bg-gray-100 transition">
            {ad.cta} →
          </span>
        </div>
      </div>
      <div className="flex gap-1.5 mt-3">
        {ADS.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
        ))}
      </div>
    </a>
  )
}
