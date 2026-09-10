"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ShieldAlert, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success("Access Granted. Welcome, Doobaaa.");
      router.push("/admin/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 selection:bg-[#e30202]/30 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#e30202]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-zinc-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-[0_0_50px_rgba(227,2,2,0.1)]">
        
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#e30202]/10 border border-[#e30202]/20 rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(227,2,2,0.2)]">
            <ShieldAlert className="w-8 h-8 text-[#e30202]" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2 tracking-wide">DOOBAAA PORTAL</h1>
        <p className="text-zinc-500 text-sm font-medium mb-8 uppercase tracking-widest">Secure Access For Examiners</p>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Email Address</label>
            <div className="relative group">
              <Mail className="w-5 h-5 absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#e30202] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@doobaaa.com"
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Password</label>
            <div className="relative group">
              <Lock className="w-5 h-5 absolute left-4 top-3.5 text-zinc-500 group-focus-within:text-[#e30202] transition-colors" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#e30202] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(227,2,2,0.4)]"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}