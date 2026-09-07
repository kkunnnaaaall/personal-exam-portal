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
    return <div className="p-8 text-gray-500 font-medium">Loading results dashboard...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exam Results</h1>
          <p className="text-sm text-gray-500 mt-1">View scores for all fully evaluated exam submissions.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search student or exam..." 
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Results Yet</h3>
          <p className="text-gray-500 mt-1">Evaluated exams will appear here once graded.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="p-4">Exam Name</th>
                <th className="p-4">Submission Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Score</th>
                <th className="p-4 text-center">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.map((attempt) => {
                // Read directly from the actual database columns shown in your Supabase screenshot
                const finalScore = attempt.total_score ?? 0;
                const totalPossibleMarks = calculateTotalMarks(attempt.exams);
                const percentage = attempt.percentage ?? (totalPossibleMarks > 0 ? Math.round((finalScore / totalPossibleMarks) * 100 * 100) / 100 : 0);

                return (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      {getExamTitle(attempt.exams)}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {attempt.submit_time ? (
                        <>
                          {new Date(attempt.submit_time).toLocaleDateString()} at {new Date(attempt.submit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </>
                      ) : (
                        "Time Unknown"
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" /> {attempt.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-lg text-gray-900">
                        {finalScore}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {" "} / {totalPossibleMarks} Marks
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium text-blue-600">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}