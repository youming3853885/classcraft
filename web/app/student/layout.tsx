import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/signin")
  }

  if (session.user.role !== "STUDENT") {
    redirect("/teacher/dashboard")
  }

  return (
    <div data-page="game" className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a2e] to-[#16213e] grid-pattern">
      {children}
    </div>
  )
}