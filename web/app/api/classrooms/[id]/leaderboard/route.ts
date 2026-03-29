import { NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: classroomId } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "xp" // xp, coins, help

  // 確認用戶是班級成員
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member) {
    return NextResponse.json({ error: "不是班級成員" }, { status: 403 })
  }

  let leaderboard: any[] = []

  if (type === "xp") {
    // 等級榜 - 按 XP 排序
    const xpData = await prisma.pointsLedger.groupBy({
      by: ["targetUserId"],
      where: { classroomId },
      _sum: { xpDelta: true },
      orderBy: { _sum: { xpDelta: "desc" } },
      take: 50,
    })

    const userIds = xpData.map(d => d.targetUserId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    leaderboard = xpData.map((d, index) => {
      const user = userMap.get(d.targetUserId)
      const totalXp = d._sum.xpDelta ?? 0
      return {
        rank: index + 1,
        userId: d.targetUserId,
        name: user?.name || "未知",
        image: user?.image,
        xp: totalXp,
        level: Math.floor(totalXp / 1000) + 1,
      }
    })
  } else if (type === "coins") {
    // 財富榜 - 按金幣排序
    const wallets = await prisma.wallet.findMany({
      where: { classroomId, currency: "COINS" },
      orderBy: { balance: "desc" },
      take: 50,
      include: { user: { select: { id: true, name: true, image: true } } },
    })

    leaderboard = wallets.map((w, index) => ({
      rank: index + 1,
      userId: w.userId,
      name: w.user.name || "未知",
      image: w.user.image,
      coins: w.balance,
    }))
  } else if (type === "help") {
    // 互助榜 - 按幫助隊友次數排序 (用 pointsLedger 的 TEAM_BONUS 事件)
    const helpData = await prisma.pointsLedger.groupBy({
      by: ["actorUserId"],
      where: { classroomId, eventType: "TEAM_HELP" },
      _count: true,
      orderBy: { _count: { actorUserId: "desc" } },
      take: 50,
    })

    const userIds = helpData.map(d => d.actorUserId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    })
    const userMap = new Map(users.map(u => [u.id, u]))

    leaderboard = helpData.map((d, index) => {
      const user = userMap.get(d.actorUserId)
      return {
        rank: index + 1,
        userId: d.actorUserId,
        name: user?.name || "未知",
        image: user?.image,
        helpCount: d._count,
      }
    })
  }

  return NextResponse.json(leaderboard)
}