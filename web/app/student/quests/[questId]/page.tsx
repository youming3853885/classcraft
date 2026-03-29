import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentQuestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ questId: string }>;
  searchParams: Promise<{ classroom?: string }>;
}) {
  const session = await getServerAuthSession();
  const { questId } = await params;
  const { classroom: classroomId } = await searchParams;
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    include: { completions: { where: { studentId: session.user.id } } },
  });

  const wallets = await prisma.wallet.findMany({ where: { userId: session.user.id, currency: "COINS" } });
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const backLink = `/student/quests${classroomId ? `?classroom=${classroomId}` : ""}`;

  if (!quest) {
    return (
      <div className="min-h-screen bg-[#0C0A09] text-white flex items-center justify-center" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <div className="text-center space-y-4">
          <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-20" />
          <p className="text-white/40">找不到這個任務</p>
          <Link href={backLink} className="text-[#CA8A04] hover:underline cursor-pointer">返回冒險地圖</Link>
        </div>
      </div>
    );
  }

  const isCompleted = quest.completions.length > 0;

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href={backLink} className="flex items-center gap-2 text-white/40 hover:text-white/80 transition cursor-pointer">
            <Image src="/logo.png" alt="logo" width={22} height={22} className="opacity-60" />
            <span className="text-sm">← 返回地圖</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#CA8A04]/50 bg-[#CA8A04]/10 px-3 py-1.5">
              <span className="text-xs font-black text-[#CA8A04]">金幣 {totalCoins}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Quest header */}
        <div className={`relative rounded-2xl border p-6 overflow-hidden ${
          isCompleted ? "border-green-500/30 bg-green-900/10" : "border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] to-[#1C1917]"
        }`}>
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-md" />

          <div className="flex items-center gap-4 mb-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              isCompleted ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]" : "bg-[#CA8A04] shadow-[0_0_20px_rgba(202,138,4,0.4)]"
            }`}>
              {isCompleted ? "✓" : "⚔"}
            </div>
            <div>
              <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>{quest.title}</h1>
              <p className="text-sm text-white/40 mt-0.5">{quest.description || "完成任務來獲得獎勵！"}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-black">
            {quest.xpReward > 0 && <span className="text-amber-400">✨ +{quest.xpReward} XP</span>}
            {quest.coinReward > 0 && <span className="text-[#CA8A04]">💰 +{quest.coinReward} 金幣</span>}
            {quest.hpReward > 0 && <span className="text-green-400">❤ +{quest.hpReward} HP</span>}
            {quest.hpReward < 0 && <span className="text-red-400">💔 {quest.hpReward} HP</span>}
          </div>

          {isCompleted && (
            <div className="mt-4 rounded-xl border border-green-500/30 bg-green-900/20 px-4 py-3 text-center">
              <p className="text-green-400 font-black">✓ 任務已完成！</p>
            </div>
          )}
        </div>

        {/* Battle zone */}
        {!isCompleted ? (
          <div className="rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 p-5 space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">發動攻擊</h2>
            <p className="text-sm text-white/40">提交你的作業來完成這個任務</p>
            <form action={`/api/quests/${questId}/submit`} method="POST" className="space-y-4">
              <textarea name="content" rows={6}
                placeholder="輸入你的答案..."
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-3 text-sm text-white placeholder-white/20 resize-none outline-none focus:border-[#CA8A04]/50 transition"
                required />
              <button type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#CA8A04] font-black text-white tracking-wider uppercase hover:opacity-90 hover:shadow-lg hover:shadow-purple-900/30 transition cursor-pointer">
                ⚔ 發動攻擊！
              </button>
              <p className="text-xs text-white/25 text-center">攻擊成功後將獲得上述獎勵</p>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-5">
            <h2 className="text-sm font-bold text-green-400 tracking-widest uppercase mb-3">戰鬥日誌</h2>
            <div className="space-y-2">
              <div className="rounded-xl bg-black/20 px-4 py-3">
                <p className="text-green-400 font-bold text-sm">✓ 任務完成</p>
                <p className="text-xs text-white/30">{new Date(quest.completions[0].completedAt).toLocaleString("zh-TW")}</p>
              </div>
              {quest.xpReward > 0 && (
                <div className="rounded-xl bg-black/20 px-4 py-3"><p className="text-amber-400 text-sm font-bold">+{quest.xpReward} XP 已獲得</p></div>
              )}
              {quest.coinReward > 0 && (
                <div className="rounded-xl bg-black/20 px-4 py-3"><p className="text-[#CA8A04] text-sm font-bold">+{quest.coinReward} 金幣 已獲得</p></div>
              )}
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href={backLink} className="inline-block rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-bold text-white/50 hover:border-white/20 hover:text-white transition cursor-pointer">
            返回冒險地圖
          </Link>
        </div>
      </div>
    </div>
  );
}
