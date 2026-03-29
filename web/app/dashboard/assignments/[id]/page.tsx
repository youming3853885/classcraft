"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  coinReward: number;
  dueAt: string | null;
  course: {
    title: string;
    classroom: {
      name: string;
    };
  };
  submissions: {
    id: string;
    content: string | null;
    submittedAt: string | null;
  }[];
}

export default function AssignmentSubmitPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/assignments/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setAssignment(data);
        if (data.submissions?.[0]?.content) {
          setContent(data.submissions[0].content);
        }
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return setError("請輸入提交內容");
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/assignments/${params.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const data = await res.json();
      setSubmitting(false);
      return setError(data.error ?? "提交失敗");
    }

    setSuccess(true);
    setTimeout(() => router.back(), 1500);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">載入中...</p>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500">找不到作業</p>
      </div>
    );
  }

  const submitted = assignment.submissions.length > 0;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-2 text-sm">
          <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-800">
            ← 返回
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <p className="text-xs text-zinc-400">
            {assignment.course.classroom.name} / {assignment.course.title}
          </p>
          <h1 className="text-2xl font-bold mt-1">{assignment.title}</h1>
          {assignment.description && (
            <p className="text-sm text-zinc-500 mt-2">{assignment.description}</p>
          )}

          <div className="flex items-center gap-4 mt-4 text-sm">
            <span className="text-amber-600">+{assignment.xpReward} XP</span>
            <span className="text-yellow-600">+{assignment.coinReward} Coins</span>
            {assignment.dueAt && (
              <span className="text-zinc-400">
                截止: {new Date(assignment.dueAt).toLocaleDateString("zh-TW")}
              </span>
            )}
          </div>

          {submitted && (
            <div className="mt-4 rounded-xl bg-green-50 px-4 py-2 text-sm text-green-700">
              已於 {new Date(assignment.submissions[0].submittedAt!).toLocaleString("zh-TW")} 提交
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold">提交作業</h2>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="輸入你的答案或作業內容..."
            rows={8}
            className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500 resize-none"
            disabled={submitting}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && (
            <p className="text-sm text-green-600">提交成功！正在返回...</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition"
              disabled={submitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || submitted}
              className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition disabled:opacity-50"
            >
              {submitting ? "提交中..." : submitted ? "已提交" : "提交作業"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
