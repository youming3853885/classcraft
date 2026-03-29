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
    return NextResponse.json({ error: "只有教師可以建立事件" }, { status: 403 })
  }

  const { id: classroomId } = await params
  const body = await request.json()
  const { title, description, xpDelta, hpDelta, coinDelta, triggerAt, triggerNow } = body

  if (!title) {
    return NextResponse.json({ error: "缺少事件名稱" }, { status: 400 })
  }

  // 驗證權限
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member || member.role !== "TEACHER") {
    return NextResponse.json({ error: "無權限" }, { status: 403 })
  }

  // 計算觸發時間
  let triggerDate: Date
  if (triggerAt) {
    triggerDate = new Date(triggerAt)
  } else {
    triggerDate = new Date()
  }

  // 建立事件
  const event = await prisma.randomEvent.create({
    data: {
      classroomId,
      title,
      description: description || "",
      xpDelta: xpDelta || 0,
      hpDelta: hpDelta || 0,
      coinDelta: coinDelta || 0,
      triggerAt: triggerDate,
      isTriggered: triggerNow === true,
    },
  })

  // 如果立即觸發，發放獎勵給所有學生
  if (triggerNow === true) {
    const students = await prisma.classroomMember.findMany({
      where: { classroomId, role: "STUDENT" },
    })

    for (const student of students) {
      await prisma.pointsLedger.create({
        data: {
          classroomId,
          targetUserId: student.userId,
          actorUserId: session.user.id,
          eventType: "RANDOM_EVENT",
          xpDelta: xpDelta || 0,
          hpDelta: hpDelta || 0,
          coinDelta: coinDelta || 0,
          reason: `命運之輪：${title}`,
        },
      })

      // 如果有金幣，更新錢包
      if (coinDelta && coinDelta !== 0) {
        await prisma.wallet.upsert({
          where: {
            userId_classroomId_currency: {
              userId: student.userId,
              classroomId,
              currency: "COINS",
            },
          },
          update: {
            balance: {
              increment: coinDelta,
            },
          },
          create: {
            userId: student.userId,
            classroomId,
            currency: "COINS",
            balance: coinDelta,
          },
        })
      }
    }
  }

  return NextResponse.json({
    success: true,
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      xpDelta: event.xpDelta,
      hpDelta: event.hpDelta,
      coinDelta: event.coinDelta,
      triggerAt: event.triggerAt,
      isTriggered: event.isTriggered,
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

  const events = await prisma.randomEvent.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ events })
}
