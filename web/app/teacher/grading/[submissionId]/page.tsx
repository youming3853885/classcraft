import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GradingDetailPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const session = await getServerAuthSession();
  const { submissionId } = await params;
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: { include: { course: { include: { classroom: true } } } },
      student: { select: { id: true, name: true, image: true, email: true } },
    },
  });

  if (!submission) {
    return (
      <div className="min-h-screen bg-[#0C0A09] text-white flex items-center justify-center" style={{ fontFamily: "'Exo 2', sans-serif" }}>
        <div className="text-center space-y-4">
          <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-20" />
          <p className="text-white/40">找不到這個提交</p>
          <Link href="/teacher/grading" className="text-[#CA8A04] hover:underline cursor-pointer">返回批改列表</Link>
        </div>
      </div>
    );
  }

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: submission.assignment.course.classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") redirect("/teacher/grading");

  const xpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: submission.studentId, classroomId: submission.assignment.course.classroomId }, _sum: { xpDelta: true } });
  const hpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: submission.studentId, classroomId: submission.assignment.course.classroomId }, _sum: { hpDelta: true } });
  const classroom = submission.assignment.course.classroom;
  const totalXp = classroom.initialXp + (xpResult._sum.xpDelta ?? 0);
  const totalHp = Math.min(classroom.maxHp, classroom.initialHp + (hpResult._sum.hpDelta ?? 0));

  const GRADES = [
    { grade: "A", label: "完美", score: 95, color: "border-green-500/50 bg-green-900/20 text-green-400" },
    { grade: "B", label: "良好", score: 85, color: "border-blue-500/50 bg-blue-900/20 text-blue-400" },
    { grade: "C", label: "一般", score: 75, color: "border-amber-500/50 bg-amber-900/20 text-amber-400" },
    { grade: "D", label: "需改進", score: 65, color: "border-orange-500/50 bg-orange-900/20 text-orange-400" },
    { grade: "F", label: "未完成", score: 50, color: "border-red-500/50 bg-red-900/20 text-red-400" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/grading" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition cursor-pointer">
              <Image src="/logo.png" alt="logo" width={22} height={22} className="opacity-60" />
              <span className="text-sm">← 批改列表</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-xs text-white/40">{classroom.name}</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* Student card */}
        <div className="relative rounded-2xl border border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] to-[#1C1917] p-6">
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="flex items-center gap-4">
            {submission.student.image ? (
              <img src={submission.student.image} alt="" className="w-14 h-14 rounded-xl ring-2 ring-[#CA8A04]/30" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-[#CA8A04]/10 border-2 border-[#CA8A04]/40 flex items-center justify-center text-2xl font-black text-[#CA8A04]">
                {(submission.student.name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>{submission.student.name}</h1>
              <p className="text-sm text-white/40">{submission.student.email}</p>
              <div className="flex gap-4 mt-1.5 text-xs font-bold">
                <span className="text-amber-400">✨ {totalXp} XP</span>
                <span className="text-green-400">❤ {totalHp}/{classroom.maxHp} HP</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assignment info */}
        <div className="rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5">
          <h2 className="font-black text-white mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>{submission.assignment.title}</h2>
          {submission.assignment.description && <p className="text-sm text-white/40 mb-3">{submission.assignment.description}</p>}
          <div className="flex gap-4 text-xs font-bold">
            <span className="text-amber-400">+{submission.assignment.xpReward} XP</span>
            <span className="text-[#CA8A04]">+{submission.assignment.coinReward} 金幣</span>
          </div>
        </div>

        {/* Submission content */}
        <div className="rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase mb-3">學生提交內容</h2>
          <div className="rounded-xl bg-[#0C0A09]/60 border border-white/5 p-4 min-h-[120px]">
            {submission.content ? (
              <p className="whitespace-pre-wrap text-sm text-white/70">{submission.content}</p>
            ) : (
              <p className="text-white/30 text-sm">學生未提交內容</p>
            )}
          </div>
          <p className="text-xs text-white/25 mt-2">
            提交時間：{submission.submittedAt?.toLocaleString("zh-TW") ?? "未知"}
          </p>
        </div>

        {/* Grading */}
        {submission.gradedAt ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-900/10 p-5 space-y-4">
            <h2 className="text-sm font-bold text-green-400 tracking-widest uppercase">✓ 已評分</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: submission.score ?? "-", label: "分數", color: "text-green-400" },
                { value: submission.grade ?? "-", label: "評等", color: "text-blue-400" },
                { value: `+${submission.assignment.xpReward}`, label: "XP", color: "text-amber-400" },
                { value: `+${submission.assignment.coinReward}`, label: "金幣", color: "text-[#CA8A04]" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-black/20 p-3 text-center">
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/30">{s.label}</p>
                </div>
              ))}
            </div>
            {submission.feedback && (
              <div className="rounded-xl bg-black/20 p-4">
                <p className="text-xs text-white/30 mb-2">老師回饋</p>
                <p className="text-sm text-white/70">{submission.feedback}</p>
              </div>
            )}
          </div>
        ) : (
          <form action={`/api/assignments/${submission.assignment.id}/grade`} method="POST"
            className="rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 p-5 space-y-5">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">進行評分</h2>

            {/* Quick grade */}
            <div>
              <p className="text-xs text-white/40 mb-2">快速評等</p>
              <div className="flex flex-wrap gap-2">
                {GRADES.map(g => (
                  <button key={g.grade} type="button"
                    onClick={() => {
                      (document.getElementById("grade-input") as HTMLSelectElement).value = g.grade;
                      (document.getElementById("score-input") as HTMLInputElement).value = String(g.score);
                    }}
                    className={`rounded-xl border px-4 py-2 text-xs font-black transition cursor-pointer ${g.color}`}>
                    {g.grade} — {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs text-white/40">分數 (0-100)</label>
                <input type="number" id="score-input" name="score" min="0" max="100" placeholder="輸入分數"
                  className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2 text-sm text-white outline-none focus:border-[#CA8A04]/50" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs text-white/40">評等</label>
                <select id="grade-input" name="grade"
                  className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2 text-sm text-white outline-none focus:border-[#CA8A04]/50 cursor-pointer">
                  <option value="">選擇評等</option>
                  {GRADES.map(g => <option key={g.grade} value={g.grade}>{g.grade} — {g.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-white/40">回饋意見</label>
              <textarea name="feedback" rows={4} placeholder="輸入回饋意見..."
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#CA8A04]/50 resize-none" />
            </div>

            <div className="rounded-xl border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-4 py-3">
              <p className="text-xs text-white/30 mb-1">將發放的獎勵</p>
              <div className="flex gap-4 text-xs font-black">
                <span className="text-amber-400">+{submission.assignment.xpReward} XP</span>
                <span className="text-[#CA8A04]">+{submission.assignment.coinReward} 金幣</span>
              </div>
            </div>

            <input type="hidden" name="studentId" value={submission.studentId} />

            <button type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 font-black text-white tracking-wider uppercase hover:from-green-500 hover:to-emerald-500 transition hover:shadow-lg hover:shadow-green-900/30 cursor-pointer">
              ⚔ 確認評分並發放獎勵
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
