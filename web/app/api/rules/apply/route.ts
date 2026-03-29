import { NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { ruleId, classroomId, targetUserId } = body

    if (!ruleId || !classroomId || !targetUserId) {
      return NextResponse.json({ error: "缺少必要參數" }, { status: 400 })
    }

    // 取得規則
    const rule = await prisma.behaviorRule.findUnique({
      where: { id: ruleId },
    })

    if (!rule) {
      return NextResponse.json({ error: "找不到規則" }, { status: 404 })
    }

    // 檢查冷卻時間
    if (rule.cooldownSec > 0) {
      const recentPoints = await prisma.pointsLedger.findFirst({
        where: {
          targetUserId,
          classroomId,
          sourceRef: ruleId,
        },
        orderBy: { createdAt: "desc" },
      })

      if (recentPoints) {
        const cooldownMs = rule.cooldownSec * 1000
        const elapsed = Date.now() - new Date(recentPoints.createdAt).getTime()
        if (elapsed < cooldownMs) {
          const remainingSec = Math.ceil((cooldownMs - elapsed) / 1000)
          return NextResponse.json(
            { error: `冷卻中，請等待 ${remainingSec} 秒後再試` },
            { status: 429 }
          )
        }
      }
    }

    // 檢查每日上限
    if (rule.dailyCap > 0) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const dailyPoints = await prisma.pointsLedger.aggregate({
        where: {
          targetUserId,
          classroomId,
          sourceRef: ruleId,
          createdAt: { gte: today },
        },
        _sum: {
          xpDelta: true,
          hpDelta: true,
          coinDelta: true,
        },
      })

      const dailyTotal =
        (dailyPoints._sum.xpDelta || 0) +
        (dailyPoints._sum.hpDelta || 0) +
        (dailyPoints._sum.coinDelta || 0)

      if (dailyTotal >= rule.dailyCap) {
        return NextResponse.json(
          { error: `今日次數已達上限 (${rule.dailyCap} 次)` },
          { status: 429 }
        )
      }
    }

    // 檢查規則是否啟用
    if (!rule.isEnabled) {
      return NextResponse.json({ error: "此規則已停用" }, { status: 400 })
    }

    // 套用規則 - 建立 PointsLedger
    const pointsLedger = await prisma.pointsLedger.create({
      data: {
        classroomId,
        targetUserId,
        actorUserId: session.user.id,
        eventType: "CLASSROOM_BEHAVIOR",
        xpDelta: rule.xpDelta,
        hpDelta: rule.hpDelta,
        coinDelta: rule.coinDelta,
        reason: rule.name,
        sourceRef: ruleId,
      },
    })

    // 更新錢包餘額
    if (rule.coinDelta !== 0) {
      await prisma.wallet.upsert({
        where: {
          userId_classroomId_currency: {
            userId: targetUserId,
            classroomId,
            currency: "COINS",
          },
        },
        create: {
          userId: targetUserId,
          classroomId,
          currency: "COINS",
          balance: rule.coinDelta,
        },
        update: {
          balance: {
            increment: rule.coinDelta,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      pointsLedger,
      applied: {
        xp: rule.xpDelta,
        hp: rule.hpDelta,
        coins: rule.coinDelta,
      },
    })
  } catch (error) {
    console.error("Apply rule error:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
