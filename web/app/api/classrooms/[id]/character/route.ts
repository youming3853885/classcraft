import { NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: classroomId } = await params
  const body = await req.json()

  const { characterClass, str, int, vit, equipment, petId } = body

  // 檢查用戶是否為該班級的成員
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member) {
    return NextResponse.json({ error: "不是班級成員" }, { status: 403 })
  }

  // 只能更新自己的角色資料
  if (member.userId !== session.user.id && session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "只能更新自己的角色" }, { status: 403 })
  }

  // 根據職業自動調整屬性加成
  let strBonus = 0
  let intBonus = 0
  let vitBonus = 0
  let hpBonus = 0
  let mpBonus = 0

  if (characterClass === "WARRIOR") {
    strBonus = 5
    vitBonus = 3
    hpBonus = 20
  } else if (characterClass === "MAGE") {
    intBonus = 5
    mpBonus = 30
  } else if (characterClass === "HEALER") {
    intBonus = 3
    vitBonus = 2
    hpBonus = 10
    mpBonus = 15
  }

  // 更新角色資料
  const updated = await prisma.classroomMember.update({
    where: { id: member.id },
    data: {
      ...(characterClass && { characterClass }),
      str: str ?? member.str,
      int: int ?? member.int,
      vit: vit ?? member.vit,
      maxHp: (member.vit + vitBonus) * 10 + hpBonus,
      maxMp: (member.int + intBonus) * 5 + mpBonus,
      currentHp: member.currentHp > 0 ? Math.min(member.currentHp, (member.vit + vitBonus) * 10 + hpBonus) : (member.vit + vitBonus) * 10 + hpBonus,
      currentMp: Math.min(member.currentMp, (member.int + intBonus) * 5 + mpBonus),
      ...(equipment && { equipment: JSON.stringify(equipment) }),
      ...(petId !== undefined && { petId }),
    },
  })

  return NextResponse.json({
    success: true,
    character: {
      ...updated,
      equipment: JSON.parse(updated.equipment || "{}"),
      classBonus: { strBonus, intBonus, vitBonus, hpBonus, mpBonus },
    },
  })
}

// 獲取角色資料
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: classroomId } = await params

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member) {
    return NextResponse.json({ error: "不是班級成員" }, { status: 404 })
  }

  return NextResponse.json({
    characterClass: member.characterClass,
    str: member.str,
    int: member.int,
    vit: member.vit,
    currentHp: member.currentHp,
    maxHp: member.maxHp,
    currentMp: member.currentMp,
    maxMp: member.maxMp,
    equipment: JSON.parse(member.equipment || "{}"),
    petId: member.petId,
  })
}