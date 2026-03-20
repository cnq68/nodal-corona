"use client";

import { useState, useRef } from "react";
import { Mic, Square, Loader2, Save, Sparkles, Wand2, ChevronDown } from "lucide-react";
import { updateNote } from "@/lib/notes";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceBlockProps {
  noteId: string;
  onFinish?: () => void;
}

export default function VoiceBlock({ noteId, onFinish }: VoiceBlockProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing mic:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (blob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob);
      const sttRes = await fetch("/api/stt", { method: "POST", body: formData });
      const { transcript } = await sttRes.json();
      setTranscript(transcript);

      const sumRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const { summary } = await sumRes.json();
      setSummary(summary);

      await updateNote(noteId, { 
        transcript, 
        summary, 
        isVoice: true 
      });

    } catch (err) {
      console.error("Error processing audio:", err);
    } finally {
      setIsProcessing(false);
      if (onFinish) onFinish();
    }
  };

  return (
    <div className="glass border border-gray-100 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
        <Mic className="w-24 h-24 text-black" />
      </div>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={isRecording ? { scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={cn(
              "p-4 rounded-2xl flex items-center justify-center transition-all",
              isRecording ? "bg-red-500 text-white shadow-xl shadow-red-200" : "bg-black text-white shadow-xl"
            )}
          >
            <Mic className="w-6 h-6" />
          </motion.div>
          <div>
            <h4 className="text-sm font-black text-black">Voice Assistant</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
              {isRecording ? "Listening Intense..." : isProcessing ? "Polishing Intelligence..." : "Ready for wisdom"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isRecording && !isProcessing && (
            <button 
              onClick={startRecording}
              className="px-6 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Start Recording
            </button>
          )}

          {isRecording && (
            <button 
              onClick={stopRecording}
              className="px-6 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl animate-pulse shadow-lg"
            >
              Stop Capture
            </button>
          )}

          {isProcessing && (
            <div className="flex items-center gap-3 text-black text-[10px] font-black uppercase tracking-widest">
              <Loader2 className="w-4 h-4 animate-spin" />
              Synthesizing...
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {(transcript || summary) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 pt-8 border-t border-gray-50 relative z-10"
          >
            <div className="bg-white/50 p-6 rounded-2xl border border-white">
              <div className="flex items-center gap-2 mb-4">
                 <Wand2 className="w-3.5 h-3.5 text-black" />
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Contextual Synthesis</span>
              </div>
              <div className="text-[15px] text-gray-800 leading-relaxed text-black">
                {summary || <span className="text-gray-300 animate-pulse">Generating epiphany...</span>}
              </div>
            </div>
            
            <details className="cursor-pointer group">
              <summary className="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-black transition-colors list-none flex items-center gap-2">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                Raw Transcript
              </summary>
              <div className="mt-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100 text-xs text-gray-400 leading-relaxed italic">
                {transcript}
              </div>
            </details>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
