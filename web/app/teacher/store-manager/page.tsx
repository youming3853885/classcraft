import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RARITY_BADGE: Record<string, string> = {
  LEGENDARY: "border-orange-500/50 bg-orange-900/20 text-orange-400",
  EPIC: "border-purple-500/50 bg-purple-900/20 text-purple-400",
  RARE: "border-blue-500/50 bg-blue-900/20 text-blue-400",
  UNCOMMON: "border-green-500/50 bg-green-900/20 text-green-400",
  COMMON: "border-white/10 bg-white/5 text-white/40",
};

export default async function TeacherStoreManagerPage() {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/onboarding");

  const equipment = await prisma.equipment.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  const consumables = await prisma.consumable.findMany({ orderBy: { createdAt: "desc" } });
  const rewards = await prisma.rewardItem.findMany({ orderBy: { createdAt: "desc" }, take: 20 });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
              <span className="text-xs border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 rounded-md text-purple-400 font-bold">GM</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {["/teacher/dashboard", "/teacher/grading", "/teacher/analytics", "/teacher/store-manager"].map((href, i) => (
                <Link key={href} href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    href === "/teacher/store-manager" ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
                  }`}>
                  {["控制台", "批改", "分析", "商店"][i]}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              {dbUser.image ? <img src={dbUser.image} alt="" className="w-4 h-4 rounded-full" /> :
                <div className="w-4 h-4 rounded-full bg-[#CA8A04]/20 flex items-center justify-center text-[9px] font-black text-[#CA8A04]">{(dbUser.name ?? "?")[0].toUpperCase()}</div>}
              <span className="text-xs text-white/60">{dbUser.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex max-w-7xl mx-auto">
        <aside className="hidden md:block w-52 flex-shrink-0 border-r border-[#CA8A04]/10 bg-[#0C0A09] p-4 pt-6 min-h-screen">
          <p className="text-xs font-bold text-[#CA8A04]/40 tracking-widest uppercase mb-3">GM 功能</p>
          <div className="space-y-1.5">
            {[
              { href: "/teacher/classes", l: "👥 班級列表", a: false },
              { href: "/teacher/grading", l: "📝 待批改", a: false },
              { href: "/teacher/analytics", l: "📈 戰況分析", a: false },
              { href: "/teacher/store-manager", l: "🏪 商店管理", a: true },
            ].map(li => (
              <Link key={li.href} href={li.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition cursor-pointer ${
                  li.a ? "bg-[#CA8A04]/10 text-[#CA8A04] border border-[#CA8A04]/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}>
                {li.l}
              </Link>
            ))}
          </div>
        </aside>

        <div className="flex-1 px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>🏪 商店與經濟控制</h1>
              <p className="text-sm text-white/40 mt-1">管理虛擬裝備與實體獎勵</p>
            </div>
            <button className="rounded-xl border border-[#CA8A04]/50 bg-[#CA8A04]/10 px-4 py-2 text-sm font-bold text-[#CA8A04] hover:bg-[#CA8A04]/20 transition cursor-pointer">
              + 新增物品
            </button>
          </div>

          {/* Equipment */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-purple-400/60 tracking-widest uppercase">⚔ 虛擬裝備 ({equipment.length})</h2>
            {equipment.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center">
                <p className="text-white/30 text-sm">尚未建立任何裝備</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {equipment.map(item => (
                  <div key={item.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 hover:border-purple-500/30 transition">
                    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-purple-500/15 rounded-tl-sm" />
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{item.type === "WEAPON" ? "⚔" : item.type === "ARMOR" ? "🛡" : "💍"}</span>
                      <span className={`text-xs font-bold border rounded-md px-1.5 py-0.5 ${RARITY_BADGE[item.rarity] ?? RARITY_BADGE.COMMON}`}>{item.rarity}</span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-xs font-bold text-purple-400">+{item.statBonus} {item.statType || "屬性"}</span>
                      <button className="text-xs text-white/30 hover:text-white/60 transition cursor-pointer">編輯</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Consumables */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-green-400/60 tracking-widest uppercase">🧪 消耗品 ({consumables.length})</h2>
            {consumables.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center">
                <p className="text-white/30 text-sm">尚未建立任何消耗品</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {consumables.map(item => (
                  <div key={item.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center">
                    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-green-500/15 rounded-tl-sm" />
                    <span className="text-2xl block mb-2">🧪</span>
                    <h3 className="font-bold text-xs text-white">{item.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-xs font-black text-amber-400">💰 {item.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Real rewards */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-amber-400/60 tracking-widest uppercase">🎁 實體獎勵 ({rewards.length})</h2>
            {rewards.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center">
                <p className="text-white/30 text-sm">尚未建立任何實體獎勵</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {rewards.map(item => (
                  <div key={item.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4">
                    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-amber-500/15 rounded-tl-sm" />
                    <span className="text-2xl block mb-2">🎁</span>
                    <h3 className="font-bold text-sm text-white">{item.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{item.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                      <span className="text-xs font-black text-amber-400">💰 {item.coinCost}</span>
                      <span className="text-xs text-white/25">庫存 {item.stock ?? "∞"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Economy settings */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">⚙ 經濟參數</h2>
            <div className="relative rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 p-5">
              <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "初始金幣", defaultVal: 100 },
                  { label: "每日 AP 上限", defaultVal: 10 },
                  { label: "初始 HP", defaultVal: 100 },
                ].map(f => (
                  <div key={f.label} className="space-y-1.5">
                    <label className="block text-xs text-white/40">{f.label}</label>
                    <input type="number" defaultValue={f.defaultVal}
                      className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-[#CA8A04]/50 transition" />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-5">
                <button className="rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#D97706] px-5 py-2.5 text-sm font-black text-[#0C0A09] hover:opacity-90 transition cursor-pointer">
                  儲存設定
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
