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
  
  // Locking mechanism states
  const [isLocked, setIsLocked] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState<string | null>(null);

  useEffect(() => {
    fetchExamDetails();
  }, [params.token]);

  // Fixed live countdown timer with Days support
  useEffect(() => {
    if (!exam || !exam.start_time) return;

    function checkTime() {
      const now = new Date().getTime();
      const startTime = new Date(exam.start_time).getTime();
      const difference = startTime - now;

      if (difference > 0) {
        setIsLocked(true);
        
        // Calculate days, hours, minutes, and seconds properly
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
      .insert([
        {
          exam_id: exam.id,
          status: "IN_PROGRESS",
        }
      ]);

    if (error) {
      toast.error("Failed to initialize exam session.");
      setStarting(false);
    } else {
      router.push(`/exam/${params.token}/attempt`);
    }
  }

  function handleCheckboxChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAgreed(e.target.checked);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading exam details...</div>;
  }

  if (!exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900">Invalid Exam Link</h1>
          <p className="text-gray-500 mt-2">Please check the URL or contact your administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <p className="opacity-90 mt-1">{exam.subject} • {exam.type.replace("_", " ")}</p>
        </div>

        <div className="p-8">
          <div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-gray-100">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              <span className="font-medium">
                Starts: {new Date(exam.start_time).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center text-gray-700">
              <Clock className="w-5 h-5 mr-2 text-blue-500" />
              <span className="font-medium">Duration: {exam.duration_minutes} Minutes</span>
            </div>
            <div className="flex items-center text-gray-700">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              <span className="font-medium">Proctored Examination</span>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-4">Mandatory Instructions</h2>
          <ul className="space-y-3 text-gray-600 mb-8 list-disc list-inside">
            <li>Read every question carefully before answering.</li>
            <li>Do not switch tabs, minimize the window, or exit fullscreen mode.</li>
            <li>The system monitors browser visibility and window focus to deter cheating.</li>
            <li>MCQs are evaluated automatically.</li>
            <li>5-mark descriptive questions will be manually evaluated by Doobaaa....</li>
            <li>Your answers are saved automatically to the server as you type.</li>
            <li>When the timer reaches zero, the exam will submit automatically.</li>
            <li>Once submitted, the exam cannot be restarted.</li>
          </ul>

          {exam.description && (
            <div className="bg-blue-50 p-4 rounded-lg mb-8">
              <h3 className="text-sm font-bold text-blue-900 mb-1">Additional Note from Doobaaa:</h3>
              <p className="text-sm text-blue-800">{exam.description}</p>
            </div>
          )}

          <div className={`flex items-start space-x-3 mb-8 p-4 rounded-lg border border-gray-200 ${isLocked ? 'bg-gray-100 opacity-70' : 'bg-gray-50'}`}>
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={handleCheckboxChange}
              disabled={isLocked}
              className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:cursor-not-allowed"
            />
            <label htmlFor="agreement" className={`text-sm text-gray-700 select-none ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              I have read and understood the instructions. I agree to maintain the integrity of this examination and understand that my browser activity will be monitored.
            </label>
          </div>

          <button
            onClick={handleStartExam}
            disabled={!agreed || starting || isLocked}
            className={`w-full py-3.5 font-bold rounded-lg transition-colors 
              ${isLocked 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            {isLocked 
              ? `Exam opens in: ${timeUntilStart}` 
              : starting 
                ? "Initializing Secure Session..." 
                : "Start Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}