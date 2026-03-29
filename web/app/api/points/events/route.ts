import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENT_TYPES = [
  "ASSIGNMENT_SUBMITTED",
  "ASSIGNMENT_REVIEWED",
  "CLASSROOM_BEHAVIOR",
  "TEAM_BONUS",
  "REWARD_REDEMPTION",
  "MANUAL_ADJUSTMENT",
];

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classroomId, targetUserId, eventType, xpDelta, hpDelta, coinDelta, reason } = await req.json();

  if (!classroomId || !targetUserId || !eventType) {
    return NextResponse.json({ error: "classroomId, targetUserId, eventType required" }, { status: 400 });
  }
  if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  // 確認教師是此班級成員
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "Not a teacher of this classroom" }, { status: 403 });
  }

  const event = await prisma.pointsLedger.create({
    data: {
      classroomId,
      targetUserId,
      actorUserId: session.user.id,
      eventType,
      xpDelta: xpDelta ?? 0,
      hpDelta: hpDelta ?? 0,
      coinDelta: coinDelta ?? 0,
      reason,
    },
  });

  // 若有 coinDelta，同步更新 Wallet
  if (coinDelta && coinDelta !== 0) {
    await prisma.wallet.upsert({
      where: { userId_classroomId_currency: { userId: targetUserId, classroomId, currency: "COINS" } },
      update: { balance: { increment: coinDelta } },
      create: { userId: targetUserId, classroomId, currency: "COINS", balance: Math.max(0, coinDelta) },
    });
  }

  return NextResponse.json(event, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classroomId = searchParams.get("classroomId");
  const targetUserId = searchParams.get("userId") ?? session.user.id;

  if (!classroomId) return NextResponse.json({ error: "classroomId required" }, { status: 400 });

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const events = await prisma.pointsLedger.findMany({
    where: { classroomId, targetUserId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(events);
}
