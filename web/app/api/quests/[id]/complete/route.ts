import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: questId } = await params;

  const quest = await prisma.quest.findUnique({ where: { id: questId } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // 檢查是否已完成
  const existing = await prisma.questCompletion.findUnique({
    where: { questId_studentId: { questId, studentId: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "Already completed" }, { status: 400 });

  // 建立完成記錄
  const completion = await prisma.questCompletion.create({
    data: { questId, studentId: session.user.id },
  });

  // 發放獎勵
  if (quest.xpReward > 0 || quest.coinReward > 0 || quest.hpReward > 0) {
    await prisma.pointsLedger.create({
      data: {
        classroomId: quest.classroomId,
        targetUserId: session.user.id,
        actorUserId: session.user.id,
        eventType: "TEAM_BONUS",
        xpDelta: quest.xpReward,
        hpDelta: quest.hpReward,
        coinDelta: quest.coinReward,
        reason: `任務完成：${quest.title}`,
        sourceRef: questId,
      },
    });

    if (quest.coinReward > 0) {
      await prisma.wallet.upsert({
        where: {
          userId_classroomId_currency: { userId: session.user.id, classroomId: quest.classroomId, currency: "COINS" },
        },
        update: { balance: { increment: quest.coinReward } },
        create: { userId: session.user.id, classroomId: quest.classroomId, currency: "COINS", balance: quest.coinReward },
      });
    }
  }

  return NextResponse.json(completion, { status: 201 });
}
