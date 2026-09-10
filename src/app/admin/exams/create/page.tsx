// src/app/admin/exams/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export default function CreateExam() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    type: "UNIT_TEST",
    duration_minutes: 30,
    start_time: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  async function handleCreateExam(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from("exams")
      .insert([{ ...formData, exam_token: token, status: "UPCOMING" }])
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to deploy vault.");
      setLoading(false);
    } else {
      toast.success("Vault created successfully!");
      router.push(`/admin/exams/${data.id}/questions`);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto selection:bg-[#e30202]/30">
      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-8 md:p-10">
        <div className="mb-8 border-b border-white/5 pb-6">
          <h1 className="text-2xl font-black text-white tracking-wide">Deploy New Vault</h1>
          <p className="text-zinc-400 mt-2 font-medium">Define the parameters and schedule for the upcoming assessment.</p>
        </div>

        <form onSubmit={handleCreateExam} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Vault Title</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="e.g., Mid-Term Assessment" className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Subject</label>
              <input type="text" name="subject" required value={formData.subject} onChange={handleChange} placeholder="e.g., Computer Science" className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Exam Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium">
                <option value="UNIT_TEST">Unit Test</option>
                <option value="SURPRISE_TEST">Surprise Test</option>
                <option value="FINAL_EXAM">Final Exam</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Duration (Minutes)</label>
              <input type="number" name="duration_minutes" required min="1" value={formData.duration_minutes} onChange={handleChange} className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Start Time (Local Time)</label>
            <input type="datetime-local" name="start_time" required value={formData.start_time} onChange={handleChange} className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium [color-scheme:dark]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Instructions / Briefing</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Enter Doobaaa's mission briefing for Doobiii..." className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium resize-none" />
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t border-white/5">
            <button type="button" onClick={() => router.back()} className="px-6 py-3.5 bg-white/5 border border-white/10 text-zinc-300 font-bold rounded-xl hover:bg-white/10 transition-all">Cancel</button>
            <button type="submit" disabled={loading} className="px-8 py-3.5 bg-[#e30202] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(227,2,2,0.4)]">
              {loading ? "Deploying..." : "Create Vault & Add Challenges"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}