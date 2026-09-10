// src/app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FileText, Clock, AlertCircle, CheckCircle, Plus, ShieldAlert, Zap } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    completed: 0,
  });

  useEffect(function loadDashboard() {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);

    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const currentTime = new Date();
      let activeCount = 0;
      let completedCount = 0;

      for (const exam of data) {
        const startTime = new Date(exam.start_time);
        const endTime = new Date(startTime.getTime() + exam.duration * 60000); 

        let currentStatus = exam.status;

        if (currentStatus === "UPCOMING" && currentTime >= startTime && currentTime < endTime) {
          currentStatus = "ACTIVE";
          await updateExamStatus(exam.id, "ACTIVE");
        } 
        else if ((currentStatus === "UPCOMING" || currentStatus === "ACTIVE") && currentTime >= endTime) {
          currentStatus = "COMPLETED";
          await updateExamStatus(exam.id, "COMPLETED");
        }

        if (currentStatus === "ACTIVE") {
          activeCount++;
        }
        if (currentStatus === "COMPLETED") {
          completedCount++;
        }

        exam.status = currentStatus;
      }

      setStats({
        total: data.length,
        active: activeCount,
        pending: completedCount, 
        completed: completedCount,
      });

      setRecentExams(data.slice(0, 5));
    }

    setLoading(false);
  }

  async function updateExamStatus(id: string, newStatus: string) {
    await supabase
      .from("exams")
      .update({ status: newStatus })
      .eq("id", id);
  }

  function navigateToCreateExam() {
    router.push("/admin/exams/create");
  }

  function navigateToSurpriseTest() {
    router.push("/admin/exams/create?type=SURPRISE");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 selection:bg-[#e30202]/30">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
          <ShieldAlert className="w-8 h-8 text-[#e30202] mr-3 drop-shadow-[0_0_10px_rgba(227,2,2,0.8)]" />
          Command Center Overview
        </h1>
        <p className="text-zinc-400 mt-2 font-medium">Welcome back, Doobaaa. Secure vault telemetry is online.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl flex items-center space-x-4 transition-all hover:border-[#e30202]/30">
          <div className="p-3 bg-zinc-800 rounded-xl shadow-inner border border-white/5">
            <FileText className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Vaults</p>
            <p className="text-2xl font-black text-white">{loading ? "-" : stats.total}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl flex items-center space-x-4 transition-all hover:border-[#e30202]/30">
          <div className="p-3 bg-[#e30202]/10 rounded-xl border border-[#e30202]/30 shadow-[0_0_15px_rgba(227,2,2,0.2)]">
            <Clock className="w-6 h-6 text-[#e30202]" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Active Exams</p>
            <p className="text-2xl font-black text-white">{loading ? "-" : stats.active}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl flex items-center space-x-4 transition-all hover:border-amber-500/30">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Pending Evals</p>
            <p className="text-2xl font-black text-white">{loading ? "-" : stats.pending}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 shadow-xl flex items-center space-x-4 transition-all hover:border-emerald-500/30">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-white">{loading ? "-" : stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Exams List */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-xl p-6 md:p-8">
          <h2 className="text-lg font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Recent Vault Deployments</h2>

          {loading ? (
            <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl font-bold animate-pulse">
              Decrypting database records...
            </div>
          ) : recentExams.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl font-medium">
              No exam vaults deployed. Initiate your first sequence.
            </div>
          ) : (
            <div className="space-y-4">
              {recentExams.map(function renderRecentExam(exam) {

                function navigateToExamDetails() {
                  router.push(`/admin/exams/${exam.id}`);
                }

                return (
                  <div 
                    key={exam.id} 
                    onClick={navigateToExamDetails}
                    className="p-5 border border-white/5 rounded-2xl bg-white/[0.02] flex items-center justify-between hover:bg-white/10 hover:border-white/10 cursor-pointer transition-all group"
                  >
                    <div>
                      <h3 className="font-black text-zinc-200 group-hover:text-white transition-colors">{exam.title || "Untitled Vault"}</h3>
                      <p className="text-sm font-medium text-zinc-500 mt-1">
                        {new Date(exam.start_time).toLocaleDateString()} • {exam.duration} mins
                      </p>
                    </div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-full border tracking-wide ${
                      exam.status === 'ACTIVE' ? 'bg-[#e30202]/10 text-[#e30202] border-[#e30202]/30 shadow-[0_0_10px_rgba(227,2,2,0.2)]' : 
                      exam.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                      'bg-white/5 text-zinc-400 border-white/10'
                    }`}>
                      {exam.status || "UPCOMING"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-[#e30202]/30 shadow-[0_0_30px_rgba(227,2,2,0.1)] p-6 md:p-8 h-fit">
          <h2 className="text-lg font-black text-[#e30202] mb-6 uppercase tracking-widest border-b border-[#e30202]/20 pb-4">Quick Actions</h2>
          <div className="space-y-4">
            <button 
              onClick={navigateToCreateExam}
              className="w-full flex items-center justify-center px-4 py-3.5 bg-[#e30202] hover:bg-red-700 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(227,2,2,0.4)]"
            >
              <Plus className="w-5 h-5 mr-2" />
              Deploy New Vault
            </button>
            <button 
              onClick={navigateToSurpriseTest}
              className="w-full flex items-center justify-center px-4 py-3.5 bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-xl hover:bg-white/10 hover:text-white transition-all"
            >
              <Zap className="w-5 h-5 mr-2 text-amber-400" />
              Schedule Surprise Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}