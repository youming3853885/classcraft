import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentAssignmentsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: {
      classroom: {
        include: {
          courses: {
            include: {
              assignments: {
                where: { publishedAt: { not: null } },
                include: { submissions: { where: { studentId: session.user.id } } },
                orderBy: { dueAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  const allAssignments: any[] = [];
  for (const m of memberships)
    for (const course of m.classroom.courses)
      for (const a of course.assignments)
        allAssignments.push({ ...a, classroomName: m.classroom.name, courseTitle: course.title });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">我的作業</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>我的作業</h1>
          <p className="text-sm text-white/40 mt-1">完成任務，獲取 XP 與金幣獎勵</p>
        </div>

        {allAssignments.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center space-y-2">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20" />
            <p className="text-white/40">目前沒有需要提交的作業</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allAssignments.map((assignment) => {
              const submitted = assignment.submissions.length > 0;
              const isPast = assignment.dueAt && new Date(assignment.dueAt) < new Date();
              const isLate = isPast && !submitted;

              return (
                <div key={assignment.id} className="relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/30 transition-all">
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#CA8A04]/20 rounded-tr-sm" />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-white/30">{assignment.classroomName} / {assignment.courseTitle}</p>
                      <h3 className="font-bold text-white mt-1">{assignment.title}</h3>
                      {assignment.description && (
                        <p className="text-sm text-white/40 mt-1">{assignment.description}</p>
                      )}
                      <div className="flex items-center flex-wrap gap-3 mt-2 text-xs">
                        <span className="text-amber-400 font-bold">+{assignment.xpReward} XP</span>
                        <span className="text-[#CA8A04] font-bold">+{assignment.coinReward} 金幣</span>
                        {assignment.dueAt && (
                          <span className={`${isLate ? "text-red-400" : "text-white/40"}`}>
                            截止：{new Date(assignment.dueAt).toLocaleDateString("zh-TW")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {submitted ? (
                        <span className="rounded-lg border border-green-500/40 bg-green-900/20 px-3 py-1.5 text-xs font-bold text-green-400">✓ 已提交</span>
                      ) : isLate ? (
                        <span className="rounded-lg border border-red-500/40 bg-red-900/20 px-3 py-1.5 text-xs font-bold text-red-400">⚠ 已逾期</span>
                      ) : (
                        <Link href={`/dashboard/assignments/${assignment.id}`}
                          className="inline-block rounded-xl border border-[#CA8A04]/50 bg-[#CA8A04]/10 px-4 py-2 text-sm font-bold text-[#CA8A04] hover:bg-[#CA8A04]/20 transition cursor-pointer">
                          前往提交 →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
