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

  const teams = await prisma.team.findMany({
    where: { classroomId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "Only teachers can create teams" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Team name required" }, { status: 400 });

  const team = await prisma.team.create({
    data: { classroomId, name: name.trim() },
  });

  return NextResponse.json(team, { status: 201 });
}
