// src/app/admin/evaluations/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckSquare, Clock, AlertCircle, ChevronRight, CheckCircle } from "lucide-react";

export default function AdminEvaluations() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pendingEvaluations, setPendingEvaluations] = useState<any[]>([]);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  async function fetchEvaluations() {
    setLoading(true);

    const { data, error } = await supabase
      .from("attempts")
      .select(`
        *,
        exams (
          title,
          type
        )
      `)
      .eq("status", "SUBMITTED")
      .order("submit_time", { ascending: false });

    if (!error && data) {
      setPendingEvaluations(data);
    }

    setLoading(false);
  }

  function navigateToReview(attemptId: string) {
    router.push(`/admin/evaluations/${attemptId}`);
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 selection:bg-[#e30202]/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
            <CheckSquare className="w-8 h-8 text-[#e30202] mr-3 drop-shadow-[0_0_10px_rgba(227,2,2,0.8)]" />
            Pending Evaluations
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">Review Doobiii's telemetry and grade descriptive challenges.</p>
        </div>

        <div className="flex items-center px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
          <span className="font-bold text-amber-500">{pendingEvaluations.length} Awaiting Review</span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl">
          <div className="w-12 h-12 border-4 border-[#e30202]/30 border-t-[#e30202] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500 font-bold uppercase tracking-widest">Decrypting logs...</p>
        </div>
      ) : pendingEvaluations.length === 0 ? (
        <div className="text-center py-24 bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2 tracking-wide">Vault Cleared!</h2>
          <p className="text-zinc-400 font-medium">No pending submissions from Doobiii right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingEvaluations.map((attempt) => {
            const examData = Array.isArray(attempt.exams) ? attempt.exams[0] : attempt.exams;
            
            return (
              <div 
                key={attempt.id} 
                onClick={() => navigateToReview(attempt.id)}
                className="bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-white/[0.02] hover:border-[#e30202]/30 cursor-pointer transition-all group shadow-lg"
              >
                <div className="flex-1 mb-4 md:mb-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-[#e30202]/10 border border-[#e30202]/20 text-[#e30202] text-[10px] font-black uppercase tracking-wider rounded-full">
                      Needs Grading
                    </span>
                    <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(attempt.submit_time).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-zinc-100 group-hover:text-white transition-colors">
                    {examData?.title || "Unknown Vault"}
                  </h3>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right mr-4">
                    <p className="text-sm font-bold text-zinc-400">MCQ Score (Auto-graded)</p>
                    <p className="text-lg font-black text-emerald-400">{attempt.mcq_score || 0} Marks</p>
                  </div>
                  
                  <button className="flex items-center px-5 py-2.5 bg-white/5 border border-white/10 text-white font-black rounded-xl group-hover:bg-[#e30202] group-hover:border-[#e30202] group-hover:shadow-[0_0_15px_rgba(227,2,2,0.4)] transition-all">
                    Evaluate <ChevronRight className="w-5 h-5 ml-1 opacity-70 group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}