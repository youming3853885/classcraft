import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const { userId } = await req.json();

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  // 檢查權限（教師或助教）
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: team.classroomId, userId: session.user.id } },
  });
  if (!member || (member.role !== "TEACHER" && member.role !== "ASSISTANT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teamMember = await prisma.teamMember.create({
    data: { teamId, userId },
  });

  return NextResponse.json(teamMember, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: teamId } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: team.classroomId, userId: session.user.id } },
  });
  if (!member || (member.role !== "TEACHER" && member.role !== "ASSISTANT")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teamMember.deleteMany({
    where: { teamId, userId },
  });

  return NextResponse.json({ ok: true });
}
