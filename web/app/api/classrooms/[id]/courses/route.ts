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
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const courses = await prisma.course.findMany({
    where: { classroomId },
    include: { _count: { select: { assignments: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: classroomId } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const course = await prisma.course.create({ data: { classroomId, title: title.trim(), description } });
  return NextResponse.json(course, { status: 201 });
}
