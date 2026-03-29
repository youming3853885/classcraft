"use client";

export function InviteCodeButton({ code }: { code: string | null }) {
  const displayCode = code ?? "";

  async function copyInviteCode() {
    await navigator.clipboard.writeText(displayCode);
    alert("邀請碼已複製！");
  }

  return (
    <button
      onClick={copyInviteCode}
      className="flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      複製
    </button>
  );
}
