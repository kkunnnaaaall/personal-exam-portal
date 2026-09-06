// src/app/exam/[token]/completed/page.tsx
"use client";

import { Trophy, Star, Sparkles, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

export default function KidsExamCompletedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden selection:bg-yellow-400/30">
      
      {/* Floating background celebratory lights */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Fun Arcade Achievement Card */}
      <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 md:p-12 text-center shadow-[0_0_60px_-15px_rgba(255,215,0,0.3)]">
        
        {/* Floating Trophy Icon with Stars */}
        <div className="flex justify-center mb-6 relative">
          <div className="absolute -top-2 flex space-x-2 animate-bounce">
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
            <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            <Star className="w-6 h-6 text-yellow-300 fill-yellow-300" />
          </div>
          <div className="w-28 h-28 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-3xl flex items-center justify-center shadow-lg shadow-amber-500/50 transform rotate-3 hover:rotate-6 transition-transform">
            <Trophy className="w-16 h-16 text-white drop-shadow-md" />
          </div>
        </div>

        {/* Achievement Badge Banner */}
        <div className="inline-flex items-center space-x-2 bg-yellow-400/20 border border-yellow-400/40 px-4 py-1.5 rounded-full text-yellow-300 font-bold text-sm mb-4">
          <Sparkles className="w-4 h-4" />
          <span>MISSION COMPLETE!</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-wide drop-shadow-md">
          Awesome Job, DOOBIIIII....! 🚀
        </h1>

        <p className="text-purple-200 text-base mb-8 leading-relaxed font-medium">
          High five! You successfully conquered all the questions and crossed the finish line like a true rockstar. 
        </p>

        {/* Action Button */}
        <button 
          onClick={() => window.close()}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-rose-500/40 hover:from-pink-400 hover:to-rose-400 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2"
        >
          <Rocket className="w-6 h-6" />
          <span>Level Complete! Close Window</span>
        </button>

      </div>
    </div>
  );
}