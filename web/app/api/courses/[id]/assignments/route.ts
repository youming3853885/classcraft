import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: course.classroomId, userId: session.user.id } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: { _count: { select: { submissions: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assignments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: courseId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: course.classroomId, userId: session.user.id } },
  });
  if (!member || member.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, xpReward, coinReward, dueAt } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      title: title.trim(),
      description,
      xpReward: xpReward ?? 10,
      coinReward: coinReward ?? 5,
      dueAt: dueAt ? new Date(dueAt) : null,
      publishedAt: new Date(),
    },
  });
  return NextResponse.json(assignment, { status: 201 });
}
