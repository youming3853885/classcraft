import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "只有學生可以施放技能" }, { status: 403 })
  }

  const body = await request.json()
  const { targetUserId, skillType, classroomId } = body

  if (!targetUserId || !skillType || !classroomId) {
    return NextResponse.json({ error: "缺少必要參數" }, { status: 400 })
  }

  // 驗證目標用戶存在
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) {
    return NextResponse.json({ error: "找不到目標用戶" }, { status: 404 })
  }

  // 驗證施放者在同一個班級
  const casterMembership = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })
  if (!casterMembership || casterMembership.role !== "STUDENT") {
    return NextResponse.json({ error: "無法在此班級施放技能" }, { status: 403 })
  }

  // 驗證目標用戶在同一個班級
  const targetMembership = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: targetUserId } },
  })
  if (!targetMembership || targetMembership.role !== "STUDENT") {
    return NextResponse.json({ error: "目標不在此班級" }, { status: 403 })
  }

  // 驗證施放者與目標在同一個隊伍
  const casterTeam = await prisma.teamMember.findFirst({
    where: { userId: session.user.id, team: { classroomId } },
  })
  const targetTeam = await prisma.teamMember.findFirst({
    where: { userId: targetUserId, team: { classroomId } },
  })

  if (!casterTeam || !targetTeam || casterTeam.teamId !== targetTeam.teamId) {
    return NextResponse.json({ error: "你與目標不在同一個隊伍" }, { status: 403 })
  }

  // 驗證施放者已解鎖該技能
  const skill = await prisma.skill.findFirst({
    where: { skillType, levelReq: { lte: 1 } }, // 等級檢查在解鎖時進行
  })

  if (!skill) {
    return NextResponse.json({ error: "技能不存在" }, { status: 404 })
  }

  const userSkill = await prisma.userSkill.findUnique({
    where: { userId_skillId: { userId: session.user.id, skillId: skill.id } },
  })

  if (!userSkill) {
    return NextResponse.json({ error: "你尚未解鎖此技能" }, { status: 403 })
  }

  // 檢查技能冷卻
  if (skill.cooldown > 0 && userSkill.lastUsedAt) {
    const cooldownMs = skill.cooldown * 1000
    const timeSinceLastUse = Date.now() - new Date(userSkill.lastUsedAt).getTime()
    if (timeSinceLastUse < cooldownMs) {
      const remainingSec = Math.ceil((cooldownMs - timeSinceLastUse) / 1000)
      return NextResponse.json({ error: `技能冷卻中，${remainingSec}秒後可再次使用` }, { status: 400 })
    }
  }

  // 獲取班級設定
  const classroom = await prisma.classroom.findUnique({ where: { id: classroomId } })
  if (!classroom) {
    return NextResponse.json({ error: "班級不存在" }, { status: 404 })
  }

  // 計算目標當前 HP
  const hpResult = await prisma.pointsLedger.aggregate({
    where: { targetUserId, classroomId },
    _sum: { hpDelta: true },
  })
  const currentHp = Math.min(classroom.maxHp, classroom.initialHp + (hpResult._sum.hpDelta ?? 0))

  // 根據技能類型計算效果
  let hpChange = 0
  let xpChange = 0
  let message = ""

  switch (skillType) {
    case "HEAL":
      // 治療技能：恢復 HP
      hpChange = Math.min(20, classroom.maxHp - currentHp) // 最多恢復 20 HP，不超過最大值
      message = `使用 ${skill.name} 恢復了 ${targetUser.name} ${hpChange} HP！`
      break

    case "BUFF":
      // 增益技能：獲得 XP
      xpChange = 10
      message = `使用 ${skill.name} 為 ${targetUser.name} 增加了 ${xpChange} XP！`
      break

    case "ATTACK":
      // 攻擊技能：對敵人造成傷害（在 PvE 中使用）
      return NextResponse.json({ error: "攻擊技能需要在戰鬥中使用" }, { status: 400 })

    default:
      return NextResponse.json({ error: "未知技能類型" }, { status: 400 })
  }

  // 記錄點數變更
  if (hpChange !== 0 || xpChange !== 0) {
    await prisma.pointsLedger.create({
      data: {
        classroomId,
        targetUserId,
        actorUserId: session.user.id,
        eventType: "TEAM_BONUS",
        hpDelta: hpChange,
        xpDelta: xpChange,
        reason: message,
      },
    })
  }

  // 更新技能使用時間
  await prisma.userSkill.update({
    where: { id: userSkill.id },
    data: { lastUsedAt: new Date() },
  })

  return NextResponse.json({
    success: true,
    message,
    hpChange,
    xpChange,
    newHp: currentHp + hpChange,
  })
}
