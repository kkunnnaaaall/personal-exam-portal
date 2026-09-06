// src/app/admin/exams/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { FileText, Copy, Trash2, PlusCircle, ExternalLink } from "lucide-react";

export default function AdminExamsList() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refresh the dashboard timer every 60 seconds
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    fetchExams();
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  async function fetchExams() {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load exams.");
    } else if (data) {
      setExams(data);
    }
    setLoading(false);
  }

  function getDisplayStatus(exam: any) {
    // 1. Trust the database FIRST. If it reached an advanced state, lock it in immediately.
    const staticStatuses = ["SUBMITTED", "PENDING_EVALUATION", "EVALUATED", "PUBLISHED"];
    if (staticStatuses.includes(exam.status)) {
      return exam.status;
    }

    // 2. If it is still UPCOMING in the database, calculate the live status based on the clock.
    if (!exam.start_time || !exam.duration_minutes) return exam.status;

    const startTime = new Date(exam.start_time).getTime();
    const endTime = startTime + (exam.duration_minutes * 60 * 1000);

    if (currentTime < startTime) {
      return "UPCOMING";
    } else if (currentTime >= startTime && currentTime <= endTime) {
      return "IN_PROGRESS";
    } else {
      return "PENDING_EVALUATION";
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "UPCOMING": return "bg-gray-100 text-gray-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "SUBMITTED": return "bg-amber-100 text-amber-800";
      case "PENDING_EVALUATION": return "bg-orange-100 text-orange-800";
      case "EVALUATED": return "bg-purple-100 text-purple-800";
      case "PUBLISHED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  }

  function formatType(type: string) {
    return type.replace("_", " ");
  }

  async function handleCopyLink(token: string) {
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/exam/${token}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Exam link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy link.");
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm("Are you sure you want to delete this exam? This will erase all associated questions and student attempts.");
    
    if (confirmed) {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", id);
        
      if (error) {
        toast.error("Failed to delete exam.");
      } else {
        toast.success("Exam deleted successfully.");
        fetchExams();
      }
    }
  }

  async function publishResult(id: string) {
    const { error } = await supabase
      .from("exams")
      .update({ status: "PUBLISHED" })
      .eq("id", id);

    if (error) {
      toast.error("Failed to publish results.");
    } else {
      toast.success("Results published to student!");
      fetchExams();
    }
  }

  if (loading) {
    return <div className="p-8">Loading exams database...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Exams</h1>
          <p className="text-gray-500 mt-1">View, distribute, and manage all your assessments.</p>
        </div>
        <button
          onClick={function createNew() { router.push("/admin/exams/create"); }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New Exam
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
        {exams.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            No exams created yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Name</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exams.map(function renderExamRow(exam) {
                const displayStatus = getDisplayStatus(exam);

                return (
                  <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{exam.title}</div>
                      <div className="text-sm text-gray-500">{exam.subject} • {exam.duration_minutes} mins</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-700">{formatType(exam.type)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(displayStatus)}`}>
                        {displayStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {displayStatus === "EVALUATED" && (
                        <button
                          onClick={function handlePublish() { publishResult(exam.id); }}
                          className="text-green-600 hover:text-green-900"
                          title="Publish Result"
                        >
                          <ExternalLink className="w-5 h-5 inline" />
                        </button>
                      )}
                      <button
                        onClick={function copyLink() { handleCopyLink(exam.exam_token); }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Copy Secure Link"
                      >
                        <Copy className="w-5 h-5 inline" />
                      </button>
                      <button
                        onClick={function deleteExam() { handleDelete(exam.id); }}
                        className="text-red-400 hover:text-red-600"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}