import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
    include: { classroom: { select: { organizationId: true } } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rewards = await prisma.rewardItem.findMany({
    where: {
      organizationId: member.classroom.organizationId,
      isActive: true
    },
    orderBy: { coinCost: "asc" },
  });

  return NextResponse.json(rewards);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can add rewards" }, { status: 403 });
  }

  const { name, description, coinCost, stock } = await req.json();
  if (!name?.trim() || !coinCost) {
    return NextResponse.json({ error: "Name and coinCost required" }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } });

  const reward = await prisma.rewardItem.create({
    data: {
      name: name.trim(),
      description,
      coinCost,
      stock,
      organizationId: classroom!.organizationId,
    },
  });

  return NextResponse.json(reward, { status: 201 });
}
