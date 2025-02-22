"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function TranscriptionResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transcribedText = searchParams.get("text");

  return (
    <main className="min-h-screen w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-start gap-8">
      <h1 className="text-4xl md:text-6xl font-normal text-center">
        文字起こし結果
      </h1>

      <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">あなたの話した内容:</h2>
        <p className="text-lg whitespace-pre-wrap">{transcribedText || "文字起こしの結果が見つかりません。"}</p>
      </div>

      <button
        onClick={() => router.back()}
        className="mt-8 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
      >
        戻る
      </button>
    </main>
  );
}