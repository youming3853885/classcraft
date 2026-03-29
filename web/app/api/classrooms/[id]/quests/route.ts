import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const quests = await prisma.quest.findMany({
    where: { classroomId, isActive: true },
    orderBy: { orderIndex: "asc" },
    include: {
      completions: member.role === "STUDENT"
        ? { where: { studentId: session.user.id } }
        : false,
    },
  });

  return NextResponse.json(quests);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can create quests" }, { status: 403 });
  }

  const { title, description, xpReward, coinReward, hpReward, isRequired, orderIndex } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  // 取得最大 orderIndex
  const maxOrder = await prisma.quest.aggregate({
    where: { classroomId },
    _max: { orderIndex: true },
  });

  const quest = await prisma.quest.create({
    data: {
      classroomId,
      title: title.trim(),
      description,
      xpReward: xpReward ?? 0,
      coinReward: coinReward ?? 0,
      hpReward: hpReward ?? 0,
      isRequired: isRequired ?? false,
      orderIndex: orderIndex ?? ((maxOrder._max.orderIndex ?? -1) + 1),
    },
  });

  return NextResponse.json(quest, { status: 201 });
}
