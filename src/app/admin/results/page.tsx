// src/app/admin/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Award, CheckCircle, Search } from "lucide-react";

export default function AdminResults() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluatedExams();
  }, []);

  async function fetchEvaluatedExams() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("attempts")
      .select(`
        *,
        exams (
          title,
          questions (
            marks
          )
        )
      `)
      .in("status", ["EVALUATED", "PUBLISHED"]) 
      .order("submit_time", { ascending: false });

    if (error) {
      console.error("Error fetching results:", error);
    } else {
      setResults(data || []);
    }
    
    setLoading(false);
  }

  function getExamTitle(examData: any) {
    if (!examData) return "Unknown Exam";
    if (Array.isArray(examData)) return examData[0]?.title || "Unknown Exam";
    return examData.title || "Unknown Exam";
  }

  function calculateTotalMarks(examData: any) {
    const exam = Array.isArray(examData) ? examData[0] : examData;
    if (!exam || !exam.questions || !Array.isArray(exam.questions)) return 0;
    return exam.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
  }

  if (loading) {
    return <div className="p-8 text-zinc-500 font-bold animate-pulse">Decrypting vault results...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto selection:bg-[#e30202]/30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
            <Award className="w-8 h-8 text-[#e30202] mr-3 drop-shadow-[0_0_10px_rgba(227,2,2,0.8)]" />
            Exam Results
          </h1>
          <p className="text-sm font-medium text-zinc-400 mt-2">View securely evaluated telemetry and scores.</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search student or exam..." 
            className="w-full md:w-72 pl-10 pr-4 py-2.5 bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all shadow-inner"
          />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 p-16 text-center shadow-xl">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-xl font-black text-white mb-2">No Results Yet</h3>
          <p className="text-zinc-500 font-medium">Evaluated vaults will decrypt here once Doobaaa grades them.</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-widest text-zinc-400 font-black">
                  <th className="p-5">Vault Name</th>
                  <th className="p-5">Submission Protocol</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 text-right">Score</th>
                  <th className="p-5 text-center">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {results.map((attempt) => {
                  const finalScore = attempt.total_score ?? 0;
                  const totalPossibleMarks = calculateTotalMarks(attempt.exams);
                  const percentage = attempt.percentage ?? (totalPossibleMarks > 0 ? Math.round((finalScore / totalPossibleMarks) * 100 * 100) / 100 : 0);

                  return (
                    <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="p-5 font-black text-zinc-200 group-hover:text-white transition-colors">
                        {getExamTitle(attempt.exams)}
                      </td>
                      <td className="p-5 text-zinc-400 text-sm font-medium">
                        {attempt.submit_time ? (
                          <>
                            {new Date(attempt.submit_time).toLocaleDateString()} at {new Date(attempt.submit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </>
                        ) : (
                          "Time Unknown"
                        )}
                      </td>
                      <td className="p-5">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> {attempt.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <span className="font-black text-lg text-white">
                          {finalScore}
                        </span>
                        <span className="text-zinc-500 text-sm font-bold tracking-wide">
                          {" "} / {totalPossibleMarks}
                        </span>
                      </td>
                      <td className="p-5 text-center font-black text-[#e30202]">
                        {percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}