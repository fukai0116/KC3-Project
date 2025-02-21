"use client";

import { useState, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getRandomStandardText } from '../constants/texts';

export default function Home() {
  const [standardText, setStandardText] = useState("");
  const { isRecording, startRecording, stopRecording, audioData, audioUrl, recordingTime } = useAudioRecorder();

  useEffect(() => {
    setStandardText(getRandomStandardText());
  }, []);

  const handleRecordClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleNewText = () => {
    setStandardText(getRandomStandardText());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="w-[1440px] h-[1024px] relative bg-white overflow-hidden mx-auto">
      <h1 className="w-[517px] h-[71px] absolute left-[461px] top-[58px] text-black text-[64px] font-normal">
        関西人チェッカー
      </h1>
      
      <div className="w-[667px] h-[271px] absolute left-[386px] top-[218px] bg-[#d9d9d9] flex flex-col items-center justify-center gap-4">
        <p className="text-[48px] font-normal px-6 text-center">
          {standardText}
        </p>
        <button
          onClick={handleNewText}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors text-lg"
        >
          別の文章に変更
        </button>
      </div>

      <p className="absolute left-[504px] top-[576px] text-black text-5xl font-normal">
        関西弁に翻訳してね
      </p>

      <div className="absolute left-[581px] top-[680px] flex flex-col items-center gap-4">
        <div className="text-2xl font-normal text-gray-700">
          {isRecording && `録音中: ${formatTime(recordingTime)}`}
        </div>
        <button 
          onClick={handleRecordClick}
          className={`w-[265px] h-[167px] bg-[#d9d9d9] rounded-full flex items-center justify-center transition-colors 
            ${isRecording ? 'bg-red-400 animate-pulse' : ''} 
            hover:bg-gray-300`}
        >
          <span className="text-black text-[64px] font-normal">録音</span>
        </button>
        {audioUrl && (
          <audio controls src={audioUrl} className="mt-4 w-[265px]" />
        )}
      </div>
    </main>
  );
}
