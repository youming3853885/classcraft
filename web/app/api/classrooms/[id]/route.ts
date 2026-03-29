import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireMember(classroomId: string, userId: string) {
  return prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId } },
  });
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await requireMember(id, session.user.id);
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } } },
      courses: { include: { _count: { select: { assignments: true } } } },
    },
  });

  return NextResponse.json(classroom);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await requireMember(id, session.user.id);
  if (!member || member.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name } = await req.json();
  const classroom = await prisma.classroom.update({ where: { id }, data: { name } });
  return NextResponse.json(classroom);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await requireMember(id, session.user.id);
  if (!member || member.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.classroom.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
