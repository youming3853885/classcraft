import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeacherPortal() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/signin")
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/student/dashboard")
  }

  // 取得教師管理的班級
  const classrooms = await prisma.classroom.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id,
          role: "TEACHER"
        }
      }
    },
    include: {
      _count: { select: { members: true } }
    }
  })

  redirect("/teacher/dashboard")
}