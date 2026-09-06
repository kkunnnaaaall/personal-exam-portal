"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { FileText, Clock, AlertCircle, CheckCircle, Plus } from "lucide-react";

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

      // 1. Process and update stale statuses dynamically
      for (const exam of data) {
        const startTime = new Date(exam.start_time);
        const endTime = new Date(startTime.getTime() + exam.duration * 60000); // duration in minutes

        let currentStatus = exam.status;

        // If it is UPCOMING but the start time has passed, it is now ACTIVE
        if (currentStatus === "UPCOMING" && currentTime >= startTime && currentTime < endTime) {
          currentStatus = "ACTIVE";
          await updateExamStatus(exam.id, "ACTIVE");
        } 
        // If the end time has completely passed, it is COMPLETED
        else if ((currentStatus === "UPCOMING" || currentStatus === "ACTIVE") && currentTime >= endTime) {
          currentStatus = "COMPLETED";
          await updateExamStatus(exam.id, "COMPLETED");
        }

        // Tally the corrected stats
        if (currentStatus === "ACTIVE") {
          activeCount++;
        }
        if (currentStatus === "COMPLETED") {
          completedCount++;
        }

        // Update the local object so the UI reflects the change immediately
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

  // Helper function to sync the corrected status back to Supabase
  async function updateExamStatus(id: string, newStatus: string) {
    await supabase
      .from("exams")
      .update({ status: newStatus })
      .eq("id", id);
  }
  
  function navigateToCreateExam() {
    // Update this route if your create exam page is located in a different folder (e.g., /admin/exams/new)
    router.push("/admin/exams/create");
  }

  function navigateToSurpriseTest() {
    router.push("/admin/exams/create?type=SURPRISE");
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back. Here is the current status of your exams.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Exams</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? "-" : stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Exams</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? "-" : stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Evaluations</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? "-" : stats.pending}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Completed Exams</p>
            <p className="text-2xl font-bold text-gray-900">{loading ? "-" : stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Exams List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Exams</h2>
          
          {loading ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
              Loading database records...
            </div>
          ) : recentExams.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
              No exams found. Create your first exam to see it here.
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
                    className="p-4 border border-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{exam.title || "Untitled Exam"}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(exam.start_time).toLocaleDateString()} • {exam.duration} mins
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      exam.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      exam.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {exam.status || "DRAFT"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              onClick={navigateToCreateExam}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Exam
            </button>
            <button 
              onClick={navigateToSurpriseTest}
              className="w-full flex items-center justify-center px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Schedule Surprise Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}