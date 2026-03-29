"use client";

export function InviteCodeButton({ code }: { code: string | null }) {
  const displayCode = code ?? "";

  async function copyInviteCode() {
    await navigator.clipboard.writeText(displayCode);
    alert("已複製: " + displayCode);
  }

  return (
    <button
      onClick={copyInviteCode}
      title="點擊複製邀請碼"
      className="inline-flex items-center justify-center rounded-xl bg-purple-900/30 border-2 border-purple-500/50 px-5 py-2 hover:bg-purple-900/50 hover:border-purple-400 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 group"
    >
      <span className="text-2xl font-black text-purple-300 group-hover:text-white font-mono tracking-[0.2em] uppercase origin-center">{displayCode}</span>
    </button>
  );
}
