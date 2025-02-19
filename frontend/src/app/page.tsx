'use client';

import React, { useState, useRef } from 'react';
import Image from "next/image";

export default function Home() {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing audio devices.', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    try {
      const res = await fetch('http://localhost:3001/transcribe', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setTranscription(data.transcription || JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setTranscription('Error during transcription');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">音声文字起こしアプリ</h1>
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <button
                onClick={recording ? stopRecording : startRecording}
                className={`px-6 py-3 rounded-full font-semibold text-white shadow-lg transform transition-all duration-200 ${
                  recording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {recording ? '録音停止' : '録音開始'}
              </button>
            </div>

            <div className="flex justify-center">
              <button
                onClick={sendAudio}
                disabled={!audioBlob}
                className={`px-6 py-3 rounded-full font-semibold shadow-lg transform transition-all duration-200 ${
                  audioBlob
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                文字起こしを開始
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">文字起こし結果</h3>
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                {transcription ? (
                  <p className="text-gray-800">{transcription}</p>
                ) : (
                  <p className="text-gray-400 text-center">
                    ここに文字起こし結果が表示されます
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {recording && (
          <div className="mt-4 text-center text-sm text-gray-500">
            録音中... マイクに向かって話してください
          </div>
        )}
      </div>
    </div>
  );
}
