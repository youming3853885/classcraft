import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: assignmentId } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });
  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: assignment.course.classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can grade" }, { status: 403 });
  }

  const { studentId, score, grade, feedback } = await req.json();
  if (typeof score !== "number" || !studentId) return NextResponse.json({ error: "Score and studentId required" }, { status: 400 });

  const submission = await prisma.assignmentSubmission.update({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    data: { score, grade, feedback, gradedAt: new Date() },
  });

  // 評分後自動寫 PointsLedger（給 XP 與 Coins）
  await prisma.pointsLedger.create({
    data: {
      classroomId: assignment.course.classroomId,
      targetUserId: studentId,
      actorUserId: session.user.id,
      eventType: "ASSIGNMENT_REVIEWED",
      xpDelta: assignment.xpReward,
      coinDelta: assignment.coinReward,
      reason: `作業評分：${assignment.title}`,
      sourceRef: assignmentId,
    },
  });

  // 更新或建立 Wallet 餘額
  await prisma.wallet.upsert({
    where: { userId_classroomId_currency: { userId: studentId, classroomId: assignment.course.classroomId, currency: "COINS" } },
    update: { balance: { increment: assignment.coinReward } },
    create: { userId: studentId, classroomId: assignment.course.classroomId, currency: "COINS", balance: assignment.coinReward },
  });

  return NextResponse.json({ submission, xpAwarded: assignment.xpReward, coinsAwarded: assignment.coinReward });
}
