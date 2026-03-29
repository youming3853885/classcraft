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

  // 取得玩家全域註冊選擇的職業
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  });
  const characterClass = (dbUser as any)?.characterClass || "WARRIOR";

  // 自動設為 STUDENT，並帶入初始屬性
  await prisma.classroomMember.create({
    data: {
      classroomId: classroom.id,
      userId: session.user.id,
      role: "STUDENT",
      characterClass,
      str: characterClass === "WARRIOR" ? 14 : characterClass === "MAGE" ? 8 : 10,
      int: characterClass === "MAGE" ? 14 : characterClass === "HEALER" ? 12 : 8,
      vit: characterClass === "WARRIOR" ? 12 : characterClass === "HEALER" ? 10 : 8,
      currentHp: characterClass === "WARRIOR" ? 120 : 100,
      maxHp: characterClass === "WARRIOR" ? 120 : 100,
      currentMp: characterClass === "MAGE" ? 80 : characterClass === "HEALER" ? 60 : 40,
      maxMp: characterClass === "MAGE" ? 80 : characterClass === "HEALER" ? 60 : 40,
    },
  });

  return NextResponse.json({ success: true, classroom });
}
