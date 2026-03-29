"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinPortalForm() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code.trim() }),
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("成功開啟新界域！");
        setCode("");
        router.refresh();
      } else {
        alert(data.error || "加入失敗");
      }
    } catch (err) {
      alert("發生錯誤！");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleJoin} className="mt-12 flex flex-col items-center shrink-0">
       <div className="flex items-center gap-4 mb-4 opacity-70">
         <div className="w-12 h-px bg-gradient-to-l from-[#A88B53]/50 to-transparent" />
         <span className="text-[10px] text-[#A88B53] tracking-widest font-mono uppercase">開啟新界域</span>
         <div className="w-12 h-px bg-gradient-to-r from-[#A88B53]/50 to-transparent" />
       </div>
       <div className="flex w-full max-w-sm relative shadow-2xl shadow-black/80">
         <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#A88B53]/50 opacity-80 z-10" />
         <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#A88B53]/50 opacity-80 z-10" />
         
         <input 
           type="text" 
           value={code}
           onChange={e => setCode(e.target.value)}
           placeholder="輸入 導師邀請秘文"
           className="w-full bg-[#0A0907] border-2 border-[#3A332C] border-r-0 text-[#D8CBB6] font-mono text-center px-4 py-3 outline-none focus:border-[#4A433C] focus:bg-[#0F0D0A] transition-colors rounded-l-md uppercase placeholder:normal-case placeholder:text-stone-700 placeholder:tracking-widest"
         />
         <button 
           type="submit" 
           disabled={loading || !code.trim()}
           className="bg-[#1A1815] border-2 border-[#3A332C] px-6 py-3 font-bold text-[#A88B53] hover:bg-[#A88B53] hover:text-[#0A0907] hover:border-[#A88B53] disabled:opacity-50 disabled:hover:bg-[#1A1815] disabled:hover:text-[#A88B53] disabled:hover:border-[#3A332C] transition-colors uppercase tracking-[0.2em] rounded-r-md min-w-[100px] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
         >
           {loading ? '詠唱中...' : '開啟'}
         </button>
       </div>
    </form>
  );
}
