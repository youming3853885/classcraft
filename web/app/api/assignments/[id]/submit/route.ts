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
  if (!member || member.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can submit" }, { status: 403 });
  }

  const { content } = await req.json();

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: session.user.id } },
    update: { content, submittedAt: new Date() },
    create: { assignmentId, studentId: session.user.id, content, submittedAt: new Date() },
  });

  // 提交作業後給予 XP/Coin 獎勵（預先發放）
  if (assignment.xpReward > 0 || assignment.coinReward > 0) {
    await prisma.pointsLedger.create({
      data: {
        classroomId: assignment.course.classroomId,
        targetUserId: session.user.id,
        actorUserId: session.user.id,
        eventType: "ASSIGNMENT_SUBMITTED",
        xpDelta: assignment.xpReward,
        coinDelta: assignment.coinReward,
        reason: `提交作業：${assignment.title}`,
        sourceRef: assignmentId,
      },
    });

    // 更新錢包餘額
    if (assignment.coinReward > 0) {
      await prisma.wallet.upsert({
        where: {
          userId_classroomId_currency: {
            userId: session.user.id,
            classroomId: assignment.course.classroomId,
            currency: "COINS",
          },
        },
        update: { balance: { increment: assignment.coinReward } },
        create: {
          userId: session.user.id,
          classroomId: assignment.course.classroomId,
          currency: "COINS",
          balance: assignment.coinReward,
        },
      });
    }
  }

  return NextResponse.json(submission, { status: 201 });
}
