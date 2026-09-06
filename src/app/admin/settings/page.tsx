// src/app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Save, User, Mail, Shield } from "lucide-react";

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    adminEmail: "",
    studentEmail: "",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      setAdminId(user.id);
      
      const { data, error } = await supabase
        .from("admins")
        .select("email, student_email")
        .eq("id", user.id)
        .single();

      if (data) {
        setFormData({
          adminEmail: data.email || user.email || "",
          studentEmail: data.student_email || "",
        });
      } else if (error && error.code === 'PGRST116') {
        // If row doesn't exist yet in public.admins, insert it
        await supabase.from("admins").insert([{ id: user.id, email: user.email }]);
        setFormData(prev => ({ ...prev, adminEmail: user.email || "" }));
      }
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (!adminId) return;

    const { error } = await supabase
      .from("admins")
      .update({ student_email: formData.studentEmail })
      .eq("id", adminId);

    if (error) {
      toast.error("Failed to update settings.");
    } else {
      toast.success("Settings saved successfully!");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="p-8">Loading settings...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
        <p className="text-gray-500 mt-1">Configure your examination portal preferences.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            Account Details
          </h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin / Examiner Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Shield className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                disabled
                value={formData.adminEmail}
                className="w-full pl-10 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Managed via Supabase Authentication.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Student Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={formData.studentEmail}
                onChange={(e) => setFormData({ ...formData, studentEmail: e.target.value })}
                placeholder="student@example.com"
                className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Surprise Test links and automated notifications will be sent exclusively to this address.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}