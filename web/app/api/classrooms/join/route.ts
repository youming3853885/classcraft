import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteCode } = await req.json();
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "邀請碼必填" }, { status: 400 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { inviteCode: inviteCode.trim() },
  });
  if (!classroom) {
    return NextResponse.json({ error: "無效的邀請碼" }, { status: 404 });
  }

  // 檢查是否已經是成員
  const existing = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: classroom.id, userId: session.user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "你已經是這個班級的成員" }, { status: 400 });
  }

  // 自動設為 STUDENT
  await prisma.classroomMember.create({
    data: {
      classroomId: classroom.id,
      userId: session.user.id,
      role: "STUDENT",
    },
  });

  return NextResponse.json({ success: true, classroom });
}
