import { NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerAuthSession()
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "只有學生可以解鎖技能" }, { status: 403 })
  }

  const body = await request.json()
  const { skillId } = body

  if (!skillId) {
    return NextResponse.json({ error: "缺少技能 ID" }, { status: 400 })
  }

  // 取得技能
  const skill = await prisma.skill.findUnique({ where: { id: skillId } })
  if (!skill) {
    return NextResponse.json({ error: "技能不存在" }, { status: 404 })
  }

  // 檢查是否已經解鎖
  const existingUnlock = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId } },
  })

  if (existingUnlock) {
    return NextResponse.json({ error: "已解鎖此技能" }, { status: 400 })
  }

  // 計算用戶等級（基於總 XP，從 xpDelta 累加）
  const xp = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id },
    _sum: { xpDelta: true },
  })
  const totalXp = xp._sum.xpDelta ?? 0
  const userLevel = Math.floor(totalXp / 1000) + 1

  // 檢查等級是否足夠
  if (userLevel < skill.levelReq) {
    return NextResponse.json(
      { error: `需要等級 ${skill.levelReq} 才能解鎖此技能（當前等級：${userLevel}）` },
      { status: 400 }
    )
  }

  // 解鎖技能
  await prisma.userSkill.create({
    data: {
      userId: session.user.id,
      skillId,
      level: 1,
    },
  })

  return NextResponse.json({
    success: true,
    message: `成功解鎖技能：${skill.name}！`,
    skill: {
      id: skill.id,
      name: skill.name,
      icon: skill.icon,
      effect: skill.effect,
    },
  })
}
