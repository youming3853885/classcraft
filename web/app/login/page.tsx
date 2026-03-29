import Link from "next/link"
import { signIn } from "next-auth/react"
import { redirect } from "next/navigation"
import { getServerAuthSession } from "@/lib/auth"

export default async function LoginPage() {
  const session = await getServerAuthSession()

  if (session?.user) {
    // 根據角色導向不同頁面
    if (session.user.role === "TEACHER" || session.user.role === "ADMIN") {
      redirect("/teacher/dashboard")
    } else {
      redirect("/student/dashboard")
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo 與標題 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <span className="text-4xl">⚔️</span>
            <span className="font-bold text-3xl tracking-tight">Classcraft</span>
          </Link>
          <p className="text-zinc-400">遊戲化學習冒險系統</p>
        </div>

        {/* 登入卡片 */}
        <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">登入你的帳號</h1>

          {/* Google 登入 */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-semibold py-3 px-4 rounded-xl hover:bg-zinc-100 transition mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            使用 Google 帳號登入
          </button>

          {/* 分隔線 */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-zinc-500 text-sm">或</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* 帳號密碼登入表單 */}
          <form action="/api/auth/callback/credentials" method="POST" className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
                電子郵件
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl transition"
            >
              登入
            </button>
          </form>

          {/* 忘記密碼 */}
          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-sm text-zinc-400 hover:text-purple-400 transition">
              忘記密碼？
            </Link>
          </div>
        </div>

        {/* 註冊連結 */}
        <div className="text-center mt-6">
          <p className="text-zinc-400">
            還沒有帳號？{" "}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold transition">
              立即註冊
            </Link>
          </p>
        </div>

        {/* 切換師生登入說明 */}
        <div className="mt-8 p-4 bg-zinc-800/30 rounded-xl border border-zinc-700">
          <p className="text-sm text-zinc-400 text-center">
            <span className="text-amber-400 font-semibold">學生</span> 註冊時需要輸入班級代碼<br />
            <span className="text-purple-400 font-semibold">教師</span> 註冊後可建立班級
          </p>
        </div>
      </div>
    </main>
  )
}