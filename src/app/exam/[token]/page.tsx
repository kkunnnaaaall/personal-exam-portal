// src/app/exam/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { AlertTriangle, Clock, FileText, Calendar } from "lucide-react";

export default function ExamInstructions() {
  const params = useParams();
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null);

  useEffect(() => {
    fetchExamDetails();
  }, [params.token]);

  useEffect(() => {
    if (!exam || !exam.start_time) return;

    function checkTime() {
      const now = new Date().getTime();
      const startTime = new Date(exam.start_time).getTime();
      const difference = startTime - now;

      if (difference > 0) {
        setIsLocked(true);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        let timeString = "";
        if (days > 0) timeString += `${days}d `;
        if (hours > 0 || days > 0) timeString += `${hours}h `;
        if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;
        
        setTimeUntilStart(timeString);
      } else {
        setIsLocked(false);
        setTimeUntilStart(null);
      }
    }

    checkTime();
    const timerInterval = setInterval(checkTime, 1000);
    return () => clearInterval(timerInterval);
  }, [exam]);

  async function fetchExamDetails() {
    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("exam_token", params.token)
      .single();

    if (error || !data) {
      toast.error("Exam not found or link is invalid.");
    } else {
      setExam(data);
    }
    setLoading(false);
  }

  async function handleStartExam() {
    setStarting(true);
    const { data: existingAttempt } = await supabase
      .from("attempts")
      .select("*")
      .eq("exam_id", exam.id)
      .single();

    if (existingAttempt) {
      if (existingAttempt.status === "SUBMITTED") {
        toast.error("You have already submitted this exam.");
        setStarting(false);
        return;
      }
      router.push(`/exam/${params.token}/attempt`);
      return;
    }

    const { error } = await supabase
      .from("attempts")
      .insert([{ exam_id: exam.id, status: "IN_PROGRESS" }]);

    if (error) {
      toast.error("Failed to initialize exam session.");
      setStarting(false);
    } else {
      router.push(`/exam/${params.token}/attempt`);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-pink-50 text-pink-900">Loading exam details...</div>;
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Invalid Exam Link</h1>
          <p className="text-gray-500 mt-2">Please check the URL or contact Doobaaa.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50/50 py-12 px-4 selection:bg-[#FFB6C1]/40">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl shadow-pink-100 overflow-hidden border border-pink-100">
        <div className="bg-[#FFB6C1] px-8 py-8 text-pink-950">
          <h1 className="text-3xl font-black">{exam.title}</h1>
          <p className="font-medium mt-2 opacity-80">{exam.subject} • {exam.type.replace("_", " ")}</p>
        </div>

        <div className="p-8 md:p-10">
          <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-pink-100">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-2 text-pink-500" />
              <span className="font-medium">Starts: {new Date(exam.start_time).toLocaleString()}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-2 text-pink-500" />
              <span className="font-medium">Duration: {exam.duration_minutes} Minutes</span>
            </div>
            <div className="flex items-center text-gray-700">
              <FileText className="w-5 h-5 mr-2 text-pink-500" />
              <span className="font-medium">Proctored Examination</span>
            </div>
          </div>

          {exam.description && (
            <div className="bg-pink-50/80 border border-pink-200 p-6 rounded-2xl mb-8">
              <h3 className="text-xs font-black text-pink-500 uppercase tracking-widest mb-2">Mission Briefing from Doobaaa:</h3>
              <p className="text-sm text-pink-950 font-medium leading-relaxed">{exam.description}</p>
            </div>
          )}

          <h2 className="text-lg font-black text-gray-900 mb-4">Mandatory Instructions</h2>
          <ul className="space-y-3 text-gray-600 mb-8 list-disc list-inside font-medium text-sm">
            <li>Read every question carefully before answering.</li>
            <li>Do not switch tabs, minimize the window, or exit fullscreen mode.</li>
            <li>The system monitors browser visibility and window focus to deter cheating.</li>
            <li>MCQs are evaluated automatically.</li>
            <li>5-mark descriptive questions will be manually evaluated by Doobaaa.</li>
            <li>When the timer reaches zero, the exam will submit automatically.</li>
          </ul>

          <div className={`flex items-start space-x-4 mb-8 p-5 rounded-2xl border ${isLocked ? 'bg-gray-50 border-gray-200 opacity-70' : 'bg-pink-50/50 border-pink-200'}`}>
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={isLocked}
              className="mt-1 w-5 h-5 text-pink-500 rounded border-pink-300 focus:ring-pink-400 disabled:cursor-not-allowed"
            />
            <label htmlFor="agreement" className={`text-sm font-medium text-gray-700 select-none ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              I have read and understood the instructions. I agree to maintain the integrity of this examination and understand that my browser activity will be monitored by Doobaaa.
            </label>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!agreed || starting || isLocked}
            className={`w-full py-4 font-black text-lg rounded-2xl transition-all shadow-lg 
              ${isLocked 
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none' 
                : 'bg-[#FFB6C1] text-pink-950 hover:bg-pink-300 shadow-pink-200 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            {isLocked 
              ? `Exam opens in: ${timeUntilStart}` 
              : starting 
                ? "Initializing Secure Vault..." 
                : "Start Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}