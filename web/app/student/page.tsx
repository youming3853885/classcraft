import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentPortal() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/signin")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/teacher/dashboard")
  }

  // 取得學生遊戲數據
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  redirect("/student/dashboard")
}