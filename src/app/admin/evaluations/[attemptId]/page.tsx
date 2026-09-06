// src/app/admin/evaluations/[attemptId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { ArrowLeft, Save, CheckCircle } from "lucide-react";

export default function GradeAttempt() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [examInfo, setExamInfo] = useState<any>(null);
  
  const [mcqScore, setMcqScore] = useState(0);
  const [descriptiveAnswers, setDescriptiveAnswers] = useState<any[]>([]);
  
  // State to hold the manual grades: { answer_id: marks_awarded }
  const [grades, setGrades] = useState<Record<string, number>>({});

  useEffect(() => {
    loadAttemptData();
  }, [attemptId]);

  async function loadAttemptData() {
    // 1. Fetch Attempt & Exam details
    const { data: attemptData } = await supabase
      .from("attempts")
      .select("*, exams(*)")
      .eq("id", attemptId)
      .single();

    if (!attemptData) return;
    setExamInfo(attemptData.exams);

    // 2. Fetch all answers for this attempt joined with question data
    const { data: answersData } = await supabase
      .from("answers")
      .select("*, questions(*)")
      .eq("attempt_id", attemptId);

    if (!answersData) return;

    let calculatedMcqScore = 0;
    const descAnswers: any[] = [];
    const initialGrades: Record<string, number> = {};

    // 3. Securely evaluate MCQs and separate the descriptive answers
    for (const ans of answersData) {
      if (ans.questions.type === "MCQ") {
        if (ans.selected_option_id) {
          // Fetch the option to check if it is correct
          const { data: optionData } = await supabase
            .from("mcq_options")
            .select("is_correct")
            .eq("id", ans.selected_option_id)
            .single();
            
          if (optionData?.is_correct) {
            calculatedMcqScore += ans.questions.marks;
          }
        }
      } else if (ans.questions.type === "DESCRIPTIVE") {
        descAnswers.push(ans);
        // Pre-fill existing grades if the admin partially graded it before
        if (ans.marks_awarded !== null) {
          initialGrades[ans.id] = ans.marks_awarded;
        } else {
          initialGrades[ans.id] = 0;
        }
      }
    }

    

    setMcqScore(calculatedMcqScore);
    setDescriptiveAnswers(descAnswers);
    setGrades(initialGrades);
    setLoading(false);
  }

  function handleGradeChange(answerId: string, marks: number, maxMarks: number) {
    if (marks < 0) marks = 0;
    if (marks > maxMarks) marks = maxMarks;
    
    setGrades(function update(prev) {
      return { ...prev, [answerId]: marks };
    });
  }

  async function finalizeEvaluation() {
    setSaving(true);
    
    // 1. Update individual descriptive answer records with marks
    for (const ans of descriptiveAnswers) {
      // Ensure the mark is a valid number, fallback to 0
      const safeMark = Number(grades[ans.id]) || 0; 
      await supabase
        .from("answers")
        .update({ marks_awarded: safeMark })
        .eq("id", ans.id);
    }

    // 2. Calculate final scores safely
    let totalDescriptiveScore = 0;
    for (const score of Object.values(grades)) {
      totalDescriptiveScore += (Number(score) || 0);
    }
    
    const finalTotalScore = (Number(mcqScore) || 0) + totalDescriptiveScore;

    // 3. Fetch all questions for this exam to accurately calculate the total possible marks
    const { data: examQuestions } = await supabase
      .from("questions")
      .select("marks")
      .eq("exam_id", examInfo?.id);

    // Sum up the max marks of every question, falling back to 1 if undefined
    const totalExamMarks = (examQuestions || []).reduce(function calculateTotal(sum, q) {
      return sum + (Number(q.marks) || 1);
    }, 0);

    // Calculate percentage safely
    const calculatedPercentage = totalExamMarks > 0 
      ? Math.round((finalTotalScore / totalExamMarks) * 100 * 100) / 100 
      : 0;

    // 4. PREPARE STRICT PAYLOAD
    const updatePayload = {
      total_score: finalTotalScore, 
      percentage: calculatedPercentage, 
      status: "EVALUATED"
    };

    console.log("Sending payload to DB:", updatePayload); // <-- Check this in your browser console

    // 5. Update the database
    const { error } = await supabase
      .from("attempts")
      .update(updatePayload)
      .eq("id", attemptId);

    if (error) {
      console.error("Database Update Error:", error); 
      toast.error("Failed to finalize evaluation.");
      setSaving(false);
    } else {
      toast.success("Exam evaluated successfully!");
      router.push("/admin/evaluations");
    }
  }

  if (loading) {
    return <div className="min-h-screen p-8">Loading student submission data...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-2">
        <button 
          onClick={function goBack() { router.push("/admin/evaluations"); }}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Evaluate Submission</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{examInfo.title}</h2>
          <p className="text-sm text-gray-500">{examInfo.subject} • Auto-Evaluated MCQ Score: <span className="font-bold text-green-600">{mcqScore} Marks</span></p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Descriptive Answers</h3>
        
        {descriptiveAnswers.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500 border border-gray-200">
            This exam contained no descriptive questions. You can finalize the evaluation directly.
          </div>
        ) : (
          descriptiveAnswers.map(function renderDescriptiveBox(ans, index) {
            return (
              <div key={ans.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Question {index + 1}
                  </span>
                  <p className="text-gray-900 font-medium">{ans.questions.question_text}</p>
                </div>
                
                <div className="p-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Student Answer:</h4>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 min-h-[100px] text-gray-800 whitespace-pre-wrap">
                    {ans.text_answer || <span className="text-gray-400 italic">No answer provided by student.</span>}
                  </div>
                </div>

                <div className="bg-blue-50 px-6 py-4 border-t border-blue-100 flex justify-between items-center">
                  <span className="text-sm font-bold text-blue-900">Award Marks (Max: {ans.questions.marks}):</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max={ans.questions.marks}
                      step="0.5"
                      value={grades[ans.id]}
                      onChange={function onGrade(e) { handleGradeChange(ans.id, parseFloat(e.target.value) || 0, ans.questions.marks); }}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500 font-medium">/ {ans.questions.marks}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex justify-end pt-6">
        <button
          onClick={finalizeEvaluation}
          disabled={saving}
          className="flex items-center px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {saving ? "Processing Final Result..." : "Finalize & Publish Result"}
        </button>
      </div>
    </div>
  );
}