import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;
  const { studentId, action, amount = 10 } = await req.json();

  // 確認教師權限
  const teacherMember = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!teacherMember || (teacherMember.role !== "TEACHER" && teacherMember.role !== "ASSISTANT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 確認學生是班級成員
  const studentMember = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: studentId } },
  });
  if (!studentMember || studentMember.role !== "STUDENT") {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });
  let xpDelta = 0, hpDelta = 0, coinDelta = 0, reason = "";

  switch (action) {
    case "ADD_XP":
      xpDelta = amount;
      reason = `教師獎勵：+${amount} XP`;
      break;
    case "ADD_HP":
      hpDelta = amount;
      reason = `教師獎勵：+${amount} HP`;
      break;
    case "SUB_HP":
      hpDelta = -amount;
      reason = `教師扣分：-${amount} HP`;
      break;
    case "ADD_COINS":
      coinDelta = amount;
      reason = `教師獎勵：+${amount} Coins`;
      break;
    case "SUB_COINS":
      coinDelta = -amount;
      reason = `教師扣分：-${amount} Coins`;
      break;
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // 寫入 PointsLedger
  const event = await prisma.pointsLedger.create({
    data: {
      classroomId,
      targetUserId: studentId,
      actorUserId: session.user.id,
      eventType: "MANUAL_ADJUSTMENT",
      xpDelta,
      hpDelta,
      coinDelta,
      reason,
    },
  });

  // 更新錢包餘額
  if (coinDelta !== 0) {
    await prisma.wallet.upsert({
      where: {
        userId_classroomId_currency: { userId: studentId, classroomId, currency: "COINS" },
      },
      update: { balance: { increment: coinDelta } },
      create: { userId: studentId, classroomId, currency: "COINS", balance: Math.max(0, coinDelta) },
    });
  }

  return NextResponse.json(event);
}
