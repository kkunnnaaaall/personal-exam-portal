// src/app/admin/exams/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Plus, Copy, Trash2, Terminal, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminExams() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  async function fetchExams() {
    setLoading(true);
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch vault data.");
    } else {
      setExams(data || []);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this vault? Doobiii's data for this exam will be lost.")) return;

    const { error } = await supabase.from("exams").delete().eq("id", id);
    
    if (error) {
      toast.error("Error deleting vault.");
    } else {
      toast.success("Vault deleted successfully.");
      setExams(exams.filter(exam => exam.id !== id));
    }
  }

  function copyExamLink(token: string) {
    const link = `${window.location.origin}/exam/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Vault link copied! Send it to Doobiii.");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto selection:bg-[#e30202]/30">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center">
            <Terminal className="w-8 h-8 text-[#e30202] mr-3 drop-shadow-[0_0_10px_rgba(227,2,2,0.8)]" />
            Vault Management
          </h1>
          <p className="text-zinc-400 mt-2 font-medium">Deploy, configure, and monitor secure challenges for Doobiii.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/exams/create")}
          className="bg-[#e30202] hover:bg-red-700 text-white font-black px-6 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(227,2,2,0.4)] flex items-center whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Deploy New Vault
        </button>
      </div>

      {/* Main Data Table */}
      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500 font-bold animate-pulse">
            Decrypting vault protocols...
          </div>
        ) : exams.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-xl font-black text-white mb-2">No Vaults Deployed</h3>
            <p className="text-zinc-500 font-medium">Time to test Doobiii! Create your first exam to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/5 text-xs uppercase tracking-widest text-zinc-500 font-black">
                  <th className="p-6">Vault Name</th>
                  <th className="p-6">Type</th>
                  <th className="p-6">Status</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="p-6">
                      <div className="font-black text-zinc-200 group-hover:text-white transition-colors">
                        {exam.title}
                      </div>
                      <div className="text-sm font-medium text-zinc-500 mt-1">
                        {exam.subject} • {exam.duration_minutes || exam.duration} mins
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="text-xs font-black text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 tracking-wider">
                        {exam.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black tracking-wide border ${
                        exam.status === 'ACTIVE' ? 'bg-[#e30202]/10 text-[#e30202] border-[#e30202]/30 shadow-[0_0_10px_rgba(227,2,2,0.2)]' : 
                        exam.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        'bg-white/5 text-zinc-400 border-white/10'
                      }`}>
                        {exam.status || "UPCOMING"}
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-3">
                      <button 
                        onClick={() => copyExamLink(exam.exam_token)}
                        className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Copy Link for Doobiii"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(exam.id)}
                        className="p-2.5 text-zinc-500 hover:text-[#e30202] hover:bg-[#e30202]/10 hover:border-[#e30202]/20 border border-transparent rounded-xl transition-all"
                        title="Delete Vault"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}