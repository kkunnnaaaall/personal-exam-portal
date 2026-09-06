// src/app/exam/[token]/result/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Award, CheckCircle, XCircle } from "lucide-react";

export default function StudentResult() {
  const params = useParams();
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResultData();
  }, [params.token]);

  async function fetchResultData() {
    // 1. Fetch Exam Data
    const { data: examData } = await supabase
      .from("exams")
      .select("*")
      .eq("exam_token", params.token)
      .single();

    if (examData) {
      setExam(examData);
      
      // 2. Fetch the student attempt
      const { data: attemptData } = await supabase
        .from("attempts")
        .select("*")
        .eq("exam_id", examData.id)
        .single();
        
      if (attemptData) {
        setAttempt(attemptData);
      }
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading result data...</div>;
  }

  if (!exam || !attempt || exam.status !== "PUBLISHED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Result Not Available</h2>
          <p className="text-gray-500 mt-2">The examiner has not published the results for this exam yet.</p>
        </div>
      </div>
    );
  }

  // Calculate percentage dynamically based on fetched scores
  const percentage = attempt.total_score > 0 ? ((attempt.total_score / (attempt.mcq_score + attempt.descriptive_score)) * 100).toFixed(1) : 0;
  const isPassing = parseFloat(percentage.toString()) >= 40.0; // Assuming 40% is pass

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        
        <div className="bg-slate-900 px-8 py-10 text-center text-white relative overflow-hidden">
          <Award className="w-20 h-20 mx-auto text-blue-400 mb-4 opacity-20 absolute top-4 left-4" />
          <h1 className="text-3xl font-bold relative z-10">Final Examination Result</h1>
          <p className="text-gray-300 mt-2 text-lg relative z-10">{exam.title} • {exam.subject}</p>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center justify-center mb-10 pb-10 border-b border-gray-100">
            <div className="text-6xl font-black text-gray-900 mb-2">
              {attempt.total_score}
            </div>
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">Total Marks Obtained</div>
            
            <div className={`flex items-center px-6 py-2 rounded-full font-bold text-lg ${isPassing ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {isPassing ? <CheckCircle className="w-6 h-6 mr-2" /> : <XCircle className="w-6 h-6 mr-2" />}
              {isPassing ? "PASS" : "FAIL"}
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-6">Score Breakdown</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="font-medium text-gray-700">Multiple Choice (Auto-Evaluated)</span>
              <span className="font-bold text-gray-900">{attempt.mcq_score} Marks</span>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100">
              <span className="font-medium text-gray-700">Descriptive Answers (Examiner Evaluated)</span>
              <span className="font-bold text-gray-900">{attempt.descriptive_score} Marks</span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            This digital record serves as the official evaluation output for this attempt.
          </div>
        </div>
      </div>
    </div>
  );
}