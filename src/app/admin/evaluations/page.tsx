// src/app/admin/evaluations/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CheckSquare, Clock, AlertCircle, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function PendingEvaluations() {
  const router = useRouter();
  const [pendingAttempts, setPendingAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingEvaluations();
  }, []);

  async function processAutoEvaluations(attempts: any[]) {
    const requiresManualReview = [];
    let autoGradedCount = 0;

    for (const attempt of attempts) {
      try {
        // Use attempt.exam_id directly to prevent relationship mapping crashes
        const { data: questions, error: qError } = await supabase
          .from("questions")
          .select("id, type, marks, mcq_options(id, is_correct)")
          .eq("exam_id", attempt.exam_id);

        if (qError || !questions || questions.length === 0) {
          requiresManualReview.push(attempt);
          continue;
        }

        // 2. Check if the exam consists ONLY of MCQs
        const isOnlyMCQ = questions.every((q) => q.type === "MCQ");

        if (isOnlyMCQ) {
          // Fetch the student's submitted answers
          const { data: answers } = await supabase
            .from("answers")
            .select("question_id, selected_option_id")
            .eq("attempt_id", attempt.id);

          let finalScore = 0;
          let totalMarks = 0;

          // 3. Calculate score based on correct options
          questions.forEach((q) => {
            const maxMarks = q.marks || 1;
            totalMarks += maxMarks;
            
            const studentAnswer = (answers || []).find((a) => a.question_id === q.id);
            if (studentAnswer && studentAnswer.selected_option_id) {
              const options = q.mcq_options || [];
              const correctOption = options.find((opt: any) => opt.is_correct === true || opt.is_correct === "true");
              
              if (correctOption && correctOption.id === studentAnswer.selected_option_id) {
                finalScore += maxMarks;
              }
            }
          });

          const percentage = totalMarks > 0 ? Math.round((finalScore / totalMarks) * 100 * 100) / 100 : 0;

          // 4. Update the attempt to EVALUATED
          await supabase
            .from("attempts")
            .update({
              status: "EVALUATED",
              mcq_score: finalScore,
              percentage: percentage,
            })
            .eq("id", attempt.id);
            
          autoGradedCount++;
        } else {
          // Exam contains descriptive questions, requires manual human grading
          requiresManualReview.push(attempt);
        }
      } catch (err) {
        console.error("Error processing attempt:", attempt.id, err);
        requiresManualReview.push(attempt); // Fail safe: push to manual review if code errors
      }
    }

    if (autoGradedCount > 0) {
      toast.success(`${autoGradedCount} MCQ-only exam(s) auto-graded and moved to Results.`);
    }

    return requiresManualReview;
  }

  async function fetchPendingEvaluations() {
    try {
      // Added exam_id to the select to ensure the auto-eval logic doesn't break
      const { data, error } = await supabase
        .from("attempts")
        .select(`
          id, start_time, submit_time, status, exam_id,
          exams ( id, title, subject )
        `)
        .in("status", ["SUBMITTED", "PENDING_EVALUATION"])
        .order("submit_time", { ascending: false });

      if (error) throw error;

      if (data) {
        const remainingAttempts = await processAutoEvaluations(data);
        setPendingAttempts(remainingAttempts);
      }
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load pending evaluations.");
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "Unknown Time";
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // Helper to safely extract exam details whether Supabase returns an object or array
  function getExamDetails(examData: any) {
    if (!examData) return { title: "Unknown Exam", subject: "Unknown" };
    if (Array.isArray(examData)) return examData[0] || { title: "Unknown Exam", subject: "Unknown" };
    return examData;
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-24 bg-gray-100 rounded w-full"></div>
            <div className="h-24 bg-gray-100 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Evaluations</h1>
          <p className="text-gray-500 mt-1">Review student submissions and grade descriptive questions.</p>
        </div>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-medium flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {pendingAttempts.length} Awaiting Review
        </div>
      </div>

      {pendingAttempts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
          <p className="text-gray-500 mt-1">There are no pending evaluations at this time.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Exam Details</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Submission Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingAttempts.map(function renderAttempt(attempt) {
                const examInfo = getExamDetails(attempt.exams);
                
                return (
                  <tr key={attempt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{examInfo.title}</div>
                      <div className="text-sm text-gray-500">{examInfo.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(attempt.submit_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        Needs Grading
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={function openGrading() { router.push(`/admin/evaluations/${attempt.id}`); }}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-900"
                      >
                        Grade Now <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
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