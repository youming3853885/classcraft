import { redirect } from "next/navigation"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import StudentCharacterClient from "./page-client"

interface Props {
  params: Promise<{ classroomId: string }>
}

export default async function StudentCharacterPage({ params }: Props) {
  const session = await getServerAuthSession()
  if (!session?.user) redirect("/signin")
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard")

  const { classroomId } = await params

  // 取得班級資料
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
  })
  if (!classroom) redirect("/student/dashboard")

  // 取得角色資料
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })
  if (!member) redirect("/student/dashboard")

  // 計算等級和 XP
  const xp = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id, classroomId },
    _sum: { xpDelta: true },
  })
  const totalXp = xp._sum.xpDelta ?? 0
  const level = Math.floor(totalXp / 1000) + 1
  const nextLevelXp = level * 1000

  // 取得金幣
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_classroomId_currency: {
        userId: session.user.id,
        classroomId,
        currency: "COINS",
      },
    },
  })

  return (
    <StudentCharacterClient
      data={{
        classroom: {
          id: classroom.id,
          name: classroom.name,
        },
        character: {
          characterClass: member.characterClass || "WARRIOR",
          str: member.str,
          int: member.int,
          vit: member.vit,
          currentHp: member.currentHp,
          maxHp: member.maxHp,
          currentMp: member.currentMp,
          maxMp: member.maxMp,
          equipment: JSON.parse(member.equipment || "{}"),
          petId: member.petId,
        },
        level,
        xp: totalXp,
        nextLevelXp,
        coins: wallet?.balance ?? 0,
      }}
    />
  )
}