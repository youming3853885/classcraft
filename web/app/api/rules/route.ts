import { NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const classroomId = searchParams.get("classroomId")
    const organizationId = searchParams.get("organizationId")

    const where: Record<string, unknown> = {}

    if (classroomId) {
      where.classroomId = classroomId
    } else if (organizationId) {
      where.organizationId = organizationId
    }

    const rules = await prisma.behaviorRule.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ rules })
  } catch (error) {
    console.error("Get rules error:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      description,
      xpDelta = 0,
      hpDelta = 0,
      coinDelta = 0,
      cooldownSec = 0,
      dailyCap = 0,
      organizationId,
      classroomId,
    } = body

    if (!name || !organizationId) {
      return NextResponse.json({ error: "名稱與組織 ID 為必填" }, { status: 400 })
    }

    // 驗證權限
    if (classroomId) {
      const membership = await prisma.classroomMember.findUnique({
        where: {
          classroomId_userId: {
            classroomId,
            userId: session.user.id,
          },
        },
      })

      if (!membership || membership.role !== "TEACHER") {
        return NextResponse.json({ error: "無權限在此班級建立規則" }, { status: 403 })
      }
    }

    const rule = await prisma.behaviorRule.create({
      data: {
        name,
        description,
        xpDelta,
        hpDelta,
        coinDelta,
        cooldownSec,
        dailyCap,
        organizationId,
        classroomId,
        isEnabled: true,
      },
    })

    return NextResponse.json({ rule }, { status: 201 })
  } catch (error) {
    console.error("Create rule error:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
