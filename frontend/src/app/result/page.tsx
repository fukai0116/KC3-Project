"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Loading } from "@/components/Loading";

export default function TranscriptionResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const transcribedText = searchParams.get("text");
  const standardText = searchParams.get("standard");
  const [analysisResult, setAnalysisResult] = useState<{
    kansaiLevel: number;
    analysis: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const hasAnalyzed = useRef(false);

  const analyzeKansaiDialect = useCallback(async () => {
    if (!standardText || !transcribedText || isAnalyzing || hasAnalyzed.current) return;
    
    hasAnalyzed.current = true;
    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:3001/analyze-kansai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          standardText,
          kansaiText: transcribedText,
        }),
      });

      const data = await response.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Failed to analyze Kansai dialect:", error);
      hasAnalyzed.current = false;
    } finally {
      setIsAnalyzing(false);
    }
  }, [standardText, transcribedText, isAnalyzing]);

  useEffect(() => {
    analyzeKansaiDialect();
  }, [analyzeKansaiDialect]);

  return (
    <>
      {isAnalyzing ? (
        <Loading message="分析中..." />
      ) : (
        <main className="min-h-screen w-full max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-start gap-8">
          <h1 className="text-4xl md:text-6xl font-normal text-center">
            文字起こし結果
          </h1>
          
          <div className="w-full max-w-2xl bg-white shadow-lg rounded-lg p-6">
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">お手本の文章:</h2>
              <p className="text-lg whitespace-pre-wrap p-4 bg-gray-50 rounded-md">
                {standardText || "標準テキストが見つかりません。"}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">あなたの話した内容:</h2>
              <p className="text-lg whitespace-pre-wrap p-4 bg-gray-50 rounded-md">
                {transcribedText || "文字起こしの結果が見つかりません。"}
              </p>
            </div>

            {!isAnalyzing && analysisResult && (
              <div className="mt-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">関西弁レベル</h2>
                  <div className="text-7xl font-bold text-blue-600 mb-2">
                    {analysisResult.kansaiLevel}%
                  </div>
                  <div className="h-4 bg-gray-200 rounded-full w-full max-w-md mx-auto">
                    <div 
                      className="h-4 bg-blue-600 rounded-full transition-all duration-500" 
                      style={{ width: `${analysisResult.kansaiLevel}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <h3 className="text-xl font-semibold mb-3">分析結果</h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed text-lg">
                    {analysisResult.analysis.split('\n').map((line, index) => (
                      line.trim() && (
                        <p key={index} className="mb-2">
                          {line.startsWith('・') ? (
                            <span className="block pl-4">{line}</span>
                          ) : (
                            line
                          )}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              </div>
            )}

            {!isAnalyzing && !analysisResult && (
              <div className="text-center p-4">
                <p className="mb-4">分析に失敗しました</p>
                <button
                  onClick={() => {
                    hasAnalyzed.current = false;
                    analyzeKansaiDialect();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  再分析
                </button>
              </div>
            )}

          </div>

          <button
            onClick={() => router.back()}
            className="mt-8 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            戻る
          </button>
        </main>
      )}
    </>
  );
}