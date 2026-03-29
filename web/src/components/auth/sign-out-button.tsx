"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-full bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
    >
      登出
    </button>
  );
}
