import { NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "只有教師可以建立魔王" }, { status: 403 })
  }

  const { id: classroomId } = await params
  const body = await request.json()
  const { title, bossHp, correctDamage, wrongDamage } = body

  if (!title) {
    return NextResponse.json({ error: "缺少魔王名稱" }, { status: 400 })
  }

  // 驗證權限
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "無權限" }, { status: 403 })
  }

  // 建立魔王
  const boss = await prisma.bossBattle.create({
    data: {
      classroomId,
      title,
      bossHp: bossHp || 100,
      currentHp: bossHp || 100,
      correctDamage: correctDamage || 10,
      wrongDamage: wrongDamage || 5,
      isActive: true,
    },
  })

  return NextResponse.json({
    success: true,
    boss: {
      id: boss.id,
      title: boss.title,
      bossHp: boss.bossHp,
      currentHp: boss.currentHp,
      isActive: boss.isActive,
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  const { id: classroomId } = await params

  // 驗證權限
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "無權限" }, { status: 403 })
  }

  const bosses = await prisma.bossBattle.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { orderBy: { orderIndex: "asc" } },
      _count: { select: { answers: true } },
    },
  })

  return NextResponse.json({ bosses })
}
