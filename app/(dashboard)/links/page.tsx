export default function LinksPage() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-bold text-gray-800">就活サービス一覧</h1>
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">一部PR含む</span>
      </div>
      <p className="text-sm text-gray-400 mb-8">就活に役立つサービスをまとめました。※一部アフィリエイトリンクを含みます。</p>

      {/* 逆求人・スカウト */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📨</span> 逆求人・スカウト型
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard
            name="キミスカ"
            tag="PR"
            desc="プロフィールを登録するだけで企業からスカウトが届く逆求人サービス。無料で利用可能。"
            href="https://px.a8.net/svt/ejp?a8mat=4B1THZ+EU1XHU+24ZO+HV7V6"
            badge="スカウト型・無料"
          />
        </div>
      </section>

      {/* OB・OG訪問 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>☕</span> OB・OG訪問
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard
            name="Matcher"
            tag="PR"
            desc="現役社会人にOB・OG訪問できるサービス。※アプリ専用のためウェブ版はありません。"
            href="https://px.a8.net/svt/ejp?a8mat=4B1V1Y+8V4G42+5JSI+61C2P"
            badge="アプリ専用"
            isApp
          />
        </div>
      </section>

      {/* 就活エージェント */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🤝</span> 就活エージェント
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard
            name="ユメキャリ就職エージェント"
            tag="PR"
            desc="大手現役人事が手掛ける完全無料の就活サポート。ES添削・面接対策・企業紹介まで対応。"
            href="https://px.a8.net/svt/ejp?a8mat=4B1V1Y+912S5U+5PWS+5Z6WX"
            badge="無料・人事経験者サポート"
          />
        </div>
      </section>

      {/* 選考情報・口コミ */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📊</span> 選考情報・口コミ
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ServiceCard
            name="ONE CAREER"
            tag="PR"
            desc="実際の選考フローや通過ESなど、リアルな就活情報が集まるプラットフォーム。"
            href="https://px.a8.net/svt/ejp?a8mat=4B1THY+5URK0I+5O7E+5YZ75"
            badge="選考情報・ES公開"
          />
        </div>
      </section>

      {/* 求人検索サイト */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🔍</span> 求人検索・エントリー
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { name: 'マイナビ2026', href: 'https://job.mynavi.jp/', desc: '大手求人サイト。エントリー・説明会予約はここから。' },
            { name: 'リクナビ2026', href: 'https://job.rikunabi.com/', desc: 'リクルート運営の就活サイト。業界・職種から検索可能。' },
            { name: 'Wantedly', href: 'https://www.wantedly.com/', desc: 'スタートアップ・ベンチャー向け。カジュアル面談が充実。' },
            { name: 'OpenWork', href: 'https://www.openwork.jp/', desc: '社員による企業口コミサイト。入社後のギャップを防げる。' },
          ].map(s => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer"
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-gray-800 text-sm">{s.name}</span>
              </div>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <p className="text-xs text-gray-400 text-center mt-4">
        ※「PR」マークのついているサービスはアフィリエイトリンクです。サービスの内容に変わりはありません。
      </p>
    </div>
  )
}

function ServiceCard({ name, tag, desc, href, badge, isApp }: {
  name: string
  tag?: string
  desc: string
  href: string
  badge?: string
  isApp?: boolean
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition block">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-800 text-sm">{name}</span>
        {tag && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">{tag}</span>}
        {isApp && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">アプリ専用</span>}
      </div>
      {badge && <span className="inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mb-2">{badge}</span>}
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </a>
  )
}
