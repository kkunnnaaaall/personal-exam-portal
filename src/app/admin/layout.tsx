// src/app/admin/layout.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, CheckSquare, Award, Settings, LogOut, ShieldAlert } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Updated to match your exact folder structure
  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Exams", href: "/admin/exams", icon: FileText },
    { name: "Evaluations", href: "/admin/evaluations", icon: CheckSquare },
    { name: "Results", href: "/admin/results", icon: Award },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  // Hide sidebar if we are on the admin login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex selection:bg-[#e30202]/30 font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900/40 backdrop-blur-xl border-r border-white/5 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center space-x-3 mb-1">
            <ShieldAlert className="w-8 h-8 text-[#e30202] drop-shadow-[0_0_8px_rgba(227,2,2,0.6)]" />
            <div>
              <h1 className="text-xl font-black tracking-wide text-white">DOOBAAA</h1>
              <p className="text-[10px] font-bold text-[#e30202] uppercase tracking-widest">Command Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  isActive 
                    ? "bg-[#e30202]/10 text-[#e30202] border border-[#e30202]/30 shadow-[0_0_15px_rgba(227,2,2,0.15)]" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#e30202]" : "text-zinc-500"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl font-bold text-sm text-zinc-400 hover:bg-red-950/30 hover:text-red-500 hover:border-red-900/50 border border-transparent transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area with Ambient Glow */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#e30202]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
}