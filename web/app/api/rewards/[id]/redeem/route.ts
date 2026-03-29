import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: rewardItemId } = await params;
  const { quantity = 1 } = await req.json();

  const reward = await prisma.rewardItem.findUnique({ where: { id: rewardItemId } });
  if (!reward || !reward.isActive) {
    return NextResponse.json({ error: "Reward not found or unavailable" }, { status: 404 });
  }

  // 找到用戶在哪個班級有這個組織的獎勵
  const classroomMember = await prisma.classroomMember.findFirst({
    where: { userId: session.user.id },
    include: { classroom: true },
  });

  if (!classroomMember) {
    return NextResponse.json({ error: "You are not in any classroom" }, { status: 403 });
  }

  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_classroomId_currency: {
        userId: session.user.id,
        classroomId: classroomMember.classroomId,
        currency: "COINS",
      },
    },
  });

  const totalCost = reward.coinCost * quantity;
  if (!wallet || wallet.balance < totalCost) {
    return NextResponse.json({ error: "Insufficient coins" }, { status: 400 });
  }

  // 檢查庫存
  if (reward.stock !== null && reward.stock < quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  // 建立兌換記錄
  const redemption = await prisma.rewardRedemption.create({
    data: {
      rewardItemId,
      userId: session.user.id,
      classroomId: classroomMember.classroomId,
      quantity,
      totalCost,
      status: "PENDING",
    },
  });

  // 扣除Coins
  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: totalCost } },
  });

  // 更新庫存
  if (reward.stock !== null) {
    await prisma.rewardItem.update({
      where: { id: rewardItemId },
      data: { stock: { decrement: quantity } },
    });
  }

  return NextResponse.json(redemption, { status: 201 });
}
