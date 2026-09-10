// src/app/exam/[token]/completed/page.tsx
"use client";

import { Crown, Sparkles, Heart, Flower2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ExamCompletedPage() {
  const router = useRouter();

  // You can pass the real percentage via query params or state later
  const percentage = 85; 
  
  let rankTitle = "Sleepy Head Doobiii 🧸";
  let rankBadge = "Needs More Boba with Doobaaa 🧋";
  
  if (percentage >= 90) {
    rankTitle = "Certified Genius Doobiii 💖";
    rankBadge = "Flawless Queen 👑";
  } else if (percentage >= 70) {
    rankTitle = "Smarty Pants Doobiii 💅";
    rankBadge = "Cute & Clever 🎀";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-pink-50 flex items-center justify-center p-4 relative overflow-hidden selection:bg-[#FFB6C1]/50">
      
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-[#FFB6C1]/30 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#FFB6C1]/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-2xl border border-pink-100 rounded-[2.5rem] p-8 md:p-12 text-center shadow-[0_0_60px_-15px_rgba(255,182,193,0.6)]">
        
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#FFB6C1] to-pink-400 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-200 transform rotate-3 hover:rotate-6 transition-transform">
            <Crown className="w-12 h-12 text-white drop-shadow-md" />
          </div>
        </div>

        <div className="inline-flex items-center space-x-2 bg-pink-50 border border-pink-200 px-4 py-1.5 rounded-full text-pink-600 font-black text-xs tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>{rankBadge}</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-pink-950 mb-3 tracking-wide">
          {rankTitle}
        </h1>

        <p className="text-gray-600 text-sm mb-6 leading-relaxed font-medium">
          Your answers are safely tucked away! Doobaaa is so proud of you. Amazing job today, Doobiii! 💕
        </p>

        {/* Cute Post-Submission Badges Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-2xl flex flex-col items-center justify-center">
            <Heart className="w-6 h-6 text-pink-500 mb-2 fill-pink-500" />
            <span className="text-[10px] font-black text-pink-900 uppercase tracking-wider">Loyal Bestie</span>
          </div>
          <div className="bg-pink-50/50 border border-pink-100 p-4 rounded-2xl flex flex-col items-center justify-center">
            <Flower2 className="w-6 h-6 text-pink-400 mb-2" />
            <span className="text-[10px] font-black text-pink-900 uppercase tracking-wider">Aesthetic Queen</span>
          </div>
        </div>

        <button 
          onClick={() => window.close()}
          className="w-full py-4 bg-[#FFB6C1] hover:bg-pink-300 text-pink-950 font-black text-sm rounded-2xl transition-all shadow-xl shadow-pink-200 flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-5 h-5" />
          <span>All Done! Close Window 🎀</span>
        </button>

      </div>
    </div>
  );
}