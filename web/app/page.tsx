import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Classcraft — 讓學習成為史詩冒險",
  description: "將 RPG 遊戲機制融入課堂教學。學生化身英雄完成任務升級，教師成為遊戲大師打造沉浸式學習體驗。",
};

const FEATURES = [
  {
    icon: "⚔️",
    title: "英雄戰鬥系統",
    desc: "學生化身勇者，以 HP、XP、MP 追蹤學習狀態。完成作業獲得經驗值，缺交則扣血量。",
    color: "from-red-900/60 to-red-800/30",
    border: "border-red-500/50",
    glow: "shadow-red-500/20",
  },
  {
    icon: "🗺️",
    title: "冒險任務地圖",
    desc: "互動式地圖呈現學習路徑視覺化。教師設計關鍵節，學生解鎖章節，清晰呈現學習進度與成就。",
    color: "from-blue-900/60 to-blue-800/30",
    border: "border-blue-500/50",
    glow: "shadow-blue-500/20",
  },
  {
    icon: "👥",
    title: "公會團隊協作",
    desc: "組建隊伍共同完成副本任務。隊友可互相救援、施放技能，將同儕互助轉化為遊戲內核心機制。",
    color: "from-green-900/60 to-green-800/30",
    border: "border-green-500/50",
    glow: "shadow-green-500/20",
  },
  {
    icon: "🏆",
    title: "成就與徽章系統",
    desc: "超過 50 種成就徽章，從「初學勇者」到「傳說學者」，激勵持續學習並提供可見的進度里程碑。",
    color: "from-yellow-900/60 to-yellow-800/30",
    border: "border-yellow-500/50",
    glow: "shadow-yellow-500/20",
  },
  {
    icon: "🤖",
    title: "AI 智慧批改",
    desc: "整合 Claude AI 自動評分，提供詳細回饋。教師節省 70% 批改時間，學生即時獲得個人化建議。",
    color: "from-purple-900/60 to-purple-800/30",
    border: "border-purple-500/50",
    glow: "shadow-purple-500/20",
  },
  {
    icon: "⚡",
    title: "即時課堂事件",
    desc: "命運之輪、魔王對決、隨機獎勵等即時課堂事件，讓每堂課都充滿驚喜，維持高度參與度。",
    color: "from-orange-900/60 to-orange-800/30",
    border: "border-orange-500/50",
    glow: "shadow-orange-500/20",
  },
];

const TESTIMONIALS = [
  {
    name: "陳怡君",
    role: "臺北市立國中 數學老師",
    avatar: "陳",
    quote: "自從使用 Classcraft，我的學生每天都期待上課。缺課率降低了 40%，作業繳交率幾乎達到 100%！",
    stars: 5,
  },
  {
    name: "林志遠",
    role: "桃園高中 英語老師",
    avatar: "林",
    quote: "學生主動問我「今天有新任務嗎？」這種熱情是我從事 15 年來從未見過的。AI 批改更是省了我大量時間。",
    stars: 5,
  },
  {
    name: "王雅婷",
    role: "新竹實驗小學 班導師",
    avatar: "王",
    quote: "公會系統讓原本不愛互動的學生開始主動幫助隊友。這不只是遊戲，這是真正的社交學習。",
    stars: 5,
  },
];

const PRICING = [
  {
    name: "勇者方案",
    price: "免費",
    sub: "適合個人教師試用",
    features: ["最多 30 位學生", "基礎任務系統", "3 種角色職業", "社群支援"],
    cta: "免費開始",
    href: "/register/teacher",
    accent: "border-[#f5a623]/50",
    btn: "bg-[#f5a623] text-[#0a0a1a] hover:bg-[#e67e22]",
    popular: false,
  },
  {
    name: "傳說方案",
    price: "NT$599",
    sub: "/ 月 · 每位教師",
    features: ["無限學生人數", "AI 智慧批改", "進階地圖編輯器", "即時課堂事件", "數據分析儀表板", "優先客服支援"],
    cta: "開始冒險",
    href: "/register/teacher",
    accent: "border-purple-500",
    btn: "bg-purple-600 text-white hover:bg-purple-500",
    popular: true,
  },
  {
    name: "學校方案",
    price: "聯絡我們",
    sub: "客製化企業報價",
    features: ["全校部署", "SSO 單一登入", "API 整合", "專屬客戶成功團隊", "教師培訓工作坊"],
    cta: "聯絡銷售",
    href: "/contact",
    accent: "border-blue-500/50",
    btn: "bg-blue-700 text-white hover:bg-blue-600",
    popular: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#06061a] text-white overflow-x-hidden" style={{ fontFamily: "'Exo 2', sans-serif" }}>

      {/* ── 浮動導覽列 ─────────────────────────────── */}
      <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl">
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#06061a]/80 px-6 py-3 backdrop-blur-xl shadow-2xl shadow-purple-900/20">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-black tracking-wide text-[#f5a623]">Classcraft</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-white/70 hover:text-[#f5a623] transition-colors">功能特色</a>
            <a href="#testimonials" className="text-sm text-white/70 hover:text-[#f5a623] transition-colors">使用者評價</a>
            <a href="#pricing" className="text-sm text-white/70 hover:text-[#f5a623] transition-colors">方案定價</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin" className="text-sm text-white/70 hover:text-white transition-colors px-4 py-2">登入</Link>
            <Link href="/register" className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-bold text-white transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/30">
              免費試用
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Epic background */}
        <div className="absolute inset-0 z-0">
          <Image src="/epic-bg.png" alt="Epic fantasy background" fill className="object-cover opacity-40" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06061a]/40 via-transparent to-[#06061a]" />
        </div>

        {/* Animated glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-[#f5a623]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-blue-600/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center py-20">
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#f5a623]/40 bg-[#f5a623]/10 px-4 py-2 text-sm text-[#f5a623] font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f5a623] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#f5a623]"></span>
              </span>
              全新 AI 批改功能現已上線 · 了解更多
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight">
                <span className="text-white">讓學習成為</span>
                <br />
                <span className="bg-gradient-to-r from-[#f5a623] via-orange-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,166,35,0.5)]">
                  史詩冒險
                </span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed max-w-lg">
                Classcraft 將 RPG 遊戲機制融入課堂教學。學生化身英雄完成任務升級，教師成為遊戲大師打造沉浸式學習體驗，提升參與率高達 <span className="text-[#f5a623] font-bold">3 倍</span>。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-orange-500 px-8 py-4 text-base font-black text-[#06061a] transition-all hover:from-yellow-400 hover:to-orange-400 hover:shadow-2xl hover:shadow-[#f5a623]/30 hover:-translate-y-0.5"
              >
                ⚔️ 免費開始冒險
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-white/40"
              >
                🎬 觀看功能介紹
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {["陳", "林", "王", "李"].map((char, i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-[#06061a] flex items-center justify-center text-xs font-bold"
                    style={{ background: `hsl(${i * 60 + 200}, 70%, 40%)` }}>
                    {char}
                  </div>
                ))}
              </div>
              <p className="text-sm text-white/60">
                已有 <span className="text-[#f5a623] font-bold">500+</span> 位教師加入
              </p>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Glow behind image */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 to-[#f5a623]/20 rounded-3xl blur-2xl transform scale-95" />
              <Image
                src="/hero-characters.png"
                alt="RPG heroes"
                width={520}
                height={420}
                className="relative z-10 drop-shadow-[0_20px_60px_rgba(245,166,35,0.3)] rounded-2xl"
                priority
              />
              {/* Floating stat cards */}
              <div className="absolute top-4 -left-8 z-20 rounded-xl border border-[#f5a623]/30 bg-[#06061a]/90 p-3 backdrop-blur-md shadow-xl">
                <div className="text-xs text-white/50">班級總 XP</div>
                <div className="text-lg font-black text-[#f5a623]">128,450</div>
              </div>
              <div className="absolute bottom-8 -right-8 z-20 rounded-xl border border-green-500/30 bg-[#06061a]/90 p-3 backdrop-blur-md shadow-xl">
                <div className="text-xs text-white/50">任務完成率</div>
                <div className="text-lg font-black text-green-400">98%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <div className="text-xs tracking-widest uppercase">Scroll</div>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/2 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "10,000+", label: "活躍學生" },
            { value: "500+", label: "教師使用中" },
            { value: "98%", label: "學生參與率" },
            { value: "3×", label: "任務完成提升" },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl font-black text-[#f5a623] mb-1">{stat.value}</div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">核心功能</p>
            <h2 className="text-4xl lg:text-5xl font-black">
              一套完整的<span className="text-[#f5a623]">遊戲化學習</span>系統
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">從課堂管理到學習追蹤，所有您需要的工具都已內建，無需額外整合。</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i}
                className={`group relative rounded-2xl border ${f.border} bg-gradient-to-b ${f.color} p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:${f.glow} cursor-default`}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-black text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">使用流程</p>
            <h2 className="text-4xl lg:text-5xl font-black">三步驟開始您的<span className="text-[#f5a623]">冒險</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-1/6 right-1/6 h-px bg-gradient-to-r from-purple-500/0 via-[#f5a623]/50 to-purple-500/0" />
            {[
              { num: "01", title: "建立班級", desc: "輸入基本資訊，選擇遊戲主題，自動生成邀請碼分享給學生。" },
              { num: "02", title: "設計任務", desc: "使用視覺化地圖編輯器創建任務鏈，設定 XP 獎勵與截止時間。" },
              { num: "03", title: "開始冒險", desc: "學生加入後即可選擇職業，馬上開始升級並完成任務。" },
            ].map((step, i) => (
              <div key={i} className="relative text-center space-y-4">
                <div className="relative inline-flex w-20 h-20 items-center justify-center rounded-2xl border-2 border-[#f5a623]/50 bg-[#f5a623]/10 text-2xl font-black text-[#f5a623] shadow-lg shadow-[#f5a623]/10">
                  {step.num}
                </div>
                <h3 className="text-xl font-black text-white">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RPG ICONS SHOWCASE ────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl border border-white/10 bg-white/3 overflow-hidden p-2">
            <Image src="/rpg-icons.png" alt="RPG Game Elements" width={900} height={400} className="w-full rounded-2xl opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06061a] via-transparent to-transparent" />
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
              <p className="text-lg font-black text-[#f5a623]">40+ 種道具與成就系統</p>
              <p className="text-sm text-white/60">讓每一次學習都有亮眼的收穫</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">教師們這樣說</p>
            <h2 className="text-4xl lg:text-5xl font-black">真實的<span className="text-[#f5a623]">學習革命</span></h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/3 p-6 space-y-4 hover:border-[#f5a623]/30 transition-colors">
                <div className="flex gap-1">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-[#f5a623]">★</span>
                  ))}
                </div>
                <p className="text-sm text-white/80 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-700 flex items-center justify-center font-bold text-sm">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-white/50">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <p className="text-sm font-bold text-purple-400 uppercase tracking-widest">方案定價</p>
            <h2 className="text-4xl lg:text-5xl font-black">透明、<span className="text-[#f5a623]">簡單</span>的定價</h2>
            <p className="text-white/60">從免費方案開始，隨著需求成長升級。沒有隱藏費用，可隨時取消。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING.map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border-2 ${plan.accent} ${plan.popular ? "bg-purple-900/30 scale-105" : "bg-white/3"} p-6 space-y-6 transition-all`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1 text-xs font-black text-white shadow-lg shadow-purple-500/30">
                    最受歡迎
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-white mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-[#f5a623]">{plan.price}</span>
                    <span className="text-sm text-white/50">{plan.sub}</span>
                  </div>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/70">
                      <span className="text-[#f5a623]">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block w-full rounded-xl ${plan.btn} py-3 text-sm font-black text-center transition-all hover:shadow-lg`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-purple-900/50 via-indigo-900/40 to-[#06061a] p-12 text-center space-y-6">
            {/* BG glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-[#f5a623]/10 blur-2xl" />
            <div className="relative z-10">
              <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-4">立即開始</p>
              <h2 className="text-4xl lg:text-5xl font-black mb-4">準備好改變您的<span className="text-[#f5a623]">課堂</span>了嗎？</h2>
              <p className="text-white/60 mb-8">加入 500+ 位已在使用 Classcraft 的教師。免費開始，無需信用卡。</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f5a623] to-orange-500 px-10 py-4 text-base font-black text-[#06061a] transition-all hover:shadow-2xl hover:shadow-[#f5a623]/30 hover:-translate-y-0.5">
                  ⚔️ 免費開始冒險
                </Link>
                <p className="flex items-center justify-center text-sm text-white/50">無需信用卡 · 5 分鐘設定完成</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="font-black text-[#f5a623]">Classcraft</span>
          </div>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-white/70 transition-colors">隱私政策</a>
            <a href="#" className="hover:text-white/70 transition-colors">使用條款</a>
            <a href="#" className="hover:text-white/70 transition-colors">聯絡我們</a>
          </div>
          <p className="text-sm text-white/30">© 2026 Classcraft · Gamified LMS Platform</p>
        </div>
      </footer>

    </div>
  );
}
