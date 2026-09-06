// src/app/exam/[token]/attempt/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Maximize } from "lucide-react";
import toast from "react-hot-toast";

export default function ExamAttempt() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  
  const [exam, setExam] = useState<any>(null);
  const [attempt, setAttempt] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");
  const [loading, setLoading] = useState(true);

  // Security & Proctoring States
  const [examStarted, setExamStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  const isSubmittedRef = useRef(isSubmitted);
  const examStartedRef = useRef(examStarted);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastViolationTimeRef = useRef<number>(0);

  // Keep refs synchronized with state for event listeners
  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
    examStartedRef.current = examStarted;
  }, [isSubmitted, examStarted]);

  useEffect(() => {
    if (token) {
      fetchExamAndAttempt();
    }
  }, [token]);

  // Anti-Cheating System: Fullscreen, Tab Switching, Context Menu, and Keys
  // Anti-Cheating System: Fullscreen, Tab Switching, Context Menu, and Keys
  useEffect(() => {
    if (loading || !attempt?.id) return;

    function handleViolation() {
      // Do not record violations if the exam hasn't started or is already submitted
      if (!examStartedRef.current || isSubmittedRef.current) return;

      const now = Date.now();
      // Prevent double-counting: Require at least 2 seconds between violations
      if (now - lastViolationTimeRef.current < 2000) return;
      
      lastViolationTimeRef.current = now;

      setViolationCount((prev) => {
        const newCount = prev + 1;
        if (newCount < 3) setShowWarning(true);
        return newCount;
      });
    }

    function onVisibilityChange() {
      if (document.hidden) handleViolation();
    }

    function onWindowBlur() {
      handleViolation();
    }

    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        handleViolation(); // Exiting fullscreen is a violation
      } else {
        setIsFullscreen(true);
      }
    }

    // Block keyboard shortcuts (F12, Copy, Paste, etc.)
    function blockKeys(e: KeyboardEvent) {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.key === "c") ||
        (e.ctrlKey && e.key === "v") ||
        (e.metaKey && e.key === "c") ||
        (e.metaKey && e.key === "v")
      ) {
        e.preventDefault();
        toast.error("Keyboard shortcuts are disabled during the exam.");
      }
    }

    // Block Right Click
    function blockContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    // Block native Copy/Paste
    function blockCopyPaste(e: ClipboardEvent) {
      e.preventDefault();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", blockKeys);
    window.addEventListener("contextmenu", blockContextMenu);
    window.addEventListener("copy", blockCopyPaste);
    window.addEventListener("paste", blockCopyPaste);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", blockKeys);
      window.removeEventListener("contextmenu", blockContextMenu);
      window.removeEventListener("copy", blockCopyPaste);
      window.removeEventListener("paste", blockCopyPaste);
    };
  }, [loading, attempt?.id]);

  // Anti-Cheating System: Auto-Submit on 3 Violations
  useEffect(() => {
    if (violationCount >= 3 && !isSubmitted && attempt?.id) {
      toast.error("Maximum violations reached. Your exam has been terminated and submitted.");
      setShowWarning(false);
      finalizeSubmission();
    }
  }, [violationCount, isSubmitted, attempt?.id]);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || !examStarted || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, examStarted, isSubmitted]);

  // Request Fullscreen Function
  async function enterFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      }
      setIsFullscreen(true);
      setExamStarted(true);
    } catch (err) {
      toast.error("Please allow full-screen mode to start the exam.");
    }
  }

  async function fetchExamAndAttempt() {
    try {
      setLoading(true);

      const { data: examData, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("exam_token", token)
        .single();

      if (examError || !examData) {
        toast.error("Exam not found or invalid token.");
        setLoading(false);
        return;
      }

      setExam(examData);
      setTimeLeft((examData.duration_minutes || examData.duration || 30) * 60);

      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select("*, mcq_options(*)") 
        .eq("exam_id", examData.id);

      if (questionsError) {
        console.error("Questions fetch error:", questionsError);
        toast.error("Failed to load exam questions.");
      } else {
        setQuestions(questionsData || []);
      }

      const { data: attemptData } = await supabase
        .from("attempts")
        .select("*")
        .eq("exam_id", examData.id)
        .maybeSingle();

      if (!attemptData) {
        const { data: newAttempt, error: createError } = await supabase
          .from("attempts")
          .insert({
            exam_id: examData.id,
            status: "IN_PROGRESS",
            start_time: new Date().toISOString()
          })
          .select()
          .single();

        if (!createError && newAttempt) {
          setAttempt(newAttempt);
        }
      } else {
        setAttempt(attemptData);
      }

    } catch (err) {
      console.error("Error loading attempt:", err);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function saveAnswerToDatabase(questionId: string, optionId: string | null, text: string | null) {
    if (!attempt?.id) return;
    setSaveStatus("SAVING");
    
    const { error } = await supabase
      .from("answers")
      .upsert({
        attempt_id: attempt.id,
        question_id: questionId,
        selected_option_id: optionId,
        text_answer: text,
        saved_at: new Date().toISOString(),
      }, { onConflict: 'attempt_id, question_id' });

    if (error) {
      toast.error("Failed to sync answer.");
      setSaveStatus("IDLE");
    } else {
      setSaveStatus("SAVED");
      setTimeout(() => setSaveStatus("IDLE"), 2000);
    }
  }

  function handleMCQSelection(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selected_option_id: optionId, text_answer: null }
    }));
    saveAnswerToDatabase(questionId, optionId, null);
  }

  function handleDescriptiveChange(questionId: string, text: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { selected_option_id: null, text_answer: text }
    }));

    setSaveStatus("SAVING");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    debounceTimerRef.current = setTimeout(() => {
      saveAnswerToDatabase(questionId, null, text);
    }, 1500);
  }

  async function handleSubmitExam() {
    await finalizeSubmission();
  }

  async function handleAutoSubmit() {
    if (!attempt?.id || isSubmitted) return;
    await finalizeSubmission();
  }

  async function finalizeSubmission() {
    if (!attempt?.id || isSubmitted) return;

    setIsSubmitted(true);
    
    // Exit fullscreen upon submission
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log(err));
    }

    const { error } = await supabase
      .from("attempts")
      .update({
        status: "SUBMITTED",
        submit_time: new Date().toISOString()
      })
      .eq("id", attempt.id);

    if (error) {
      console.error("Submission error:", error);
      toast.error("Error submitting exam. Please try again.");
      setIsSubmitted(false);
    } else {
      toast.success("Exam submitted successfully!");
      router.push(`/exam/${token}/completed`);
    }
  }

  if (loading || !exam) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 font-medium">Loading Secure Exam Environment...</div>;
  }

  // Pre-exam Fullscreen Gate
  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <Maximize className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Secure Exam Mode</h2>
          <p className="text-gray-600 mb-8">
            This exam requires full-screen mode. Do not attempt to open new tabs, use keyboard shortcuts, or exit full-screen, as it will be recorded as a violation.
          </p>
          <button
            onClick={enterFullscreen}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
          >
            Enter Full Screen & Begin Exam
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];
  const currentAnswer = currentQ ? answers[currentQ.id] || {} : {};
  const isLastQuestion = currentQIndex === questions.length - 1;
  const isTimeWarning = timeLeft !== null && timeLeft <= 300;

  const rawOptions = currentQ?.mcq_options || currentQ?.options || [];
  const optionsList = Array.isArray(rawOptions) ? rawOptions : [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 select-none">
      
      {/* WARNING MODAL OVERLAY */}
      {showWarning && violationCount < 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Warning!</h2>
            <p className="text-gray-600 mb-6 text-sm">
              You exited full-screen or clicked outside the exam. This is a strict violation of the rules.
              <br /><br />
              <span className="text-lg text-red-600 font-black tracking-wide">
                VIOLATION {violationCount} OF 3
              </span>
              <br /><br />
              If you reach 3 violations, your exam will be automatically submitted.
            </p>
            <button
              onClick={() => {
                setShowWarning(false);
                enterFullscreen(); // Force them back into fullscreen when dismissing warning
              }}
              className="w-full py-3.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              I Understand, Return to Exam
            </button>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{exam.title}</h1>
          <p className="text-sm text-gray-500">Violations Recorded: <span className={violationCount > 0 ? "text-red-500 font-bold" : ""}>{violationCount}/3</span></p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-sm hidden md:block">
            {saveStatus === "SAVING" && <span className="text-amber-500 animate-pulse font-medium">Saving...</span>}
            {saveStatus === "SAVED" && <span className="text-green-600 font-medium flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Saved</span>}
          </div>
          
          <div className={`flex items-center px-4 py-2 rounded-lg font-bold text-lg ${isTimeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-blue-50 text-blue-700"}`}>
            <Clock className="w-5 h-5 mr-2" />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>

          <button
            onClick={handleSubmitExam}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Submit Exam
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col">
          {currentQ ? (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-medium bg-gray-100 text-gray-700 py-1 px-3 rounded">
                  {currentQ.marks || 1} Marks
                </span>
              </div>

              <div className="flex-1">
                <p className="text-lg text-gray-900 font-medium mb-8 whitespace-pre-wrap">
                  {currentQ.question_text || currentQ.text}
                </p>

                {currentQ.type === "MCQ" ? (
                  <div className="space-y-3">
                    {optionsList.map((opt: any, idx: number) => {
                      const optId = opt.id || idx.toString();
                      const optText = opt.option_text || opt.text || opt;
                      const isSelected = currentAnswer.selected_option_id === optId;
                      
                      return (
                        <label 
                          key={optId} 
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQ.id}`}
                            value={optId}
                            checked={isSelected}
                            onChange={() => handleMCQSelection(currentQ.id, optId)}
                            className="w-5 h-5 text-blue-600 focus:ring-blue-500 mr-4"
                          />
                          <span className="text-gray-800">{optText}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col h-64">
                    <textarea
                      value={currentAnswer.text_answer || ""}
                      onChange={(e) => handleDescriptiveChange(currentQ.id, e.target.value)}
                      placeholder="Type your descriptive answer here..."
                      className="flex-1 w-full p-4 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      onPaste={(e) => { e.preventDefault(); toast.error("Pasting is disabled."); }}
                    ></textarea>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">No questions available for this exam.</div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setCurrentQIndex((idx) => Math.max(0, idx - 1))}
              disabled={currentQIndex === 0}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 mr-1" /> Previous
            </button>
            
            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQIndex((idx) => Math.min(questions.length - 1, idx + 1))}
                className="flex items-center px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmitExam}
                className="flex items-center px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
              >
                Submit Exam
              </button>
            )}
          </div>
        </main>

        <aside className="w-full md:w-72 bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit">
          <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id]?.selected_option_id || (answers[q.id]?.text_answer && answers[q.id].text_answer.trim().length > 0);
              const isCurrent = currentQIndex === idx;
              
              let baseStyles = "w-10 h-10 rounded-lg font-medium text-sm flex items-center justify-center border transition-colors";
              if (isCurrent) {
                baseStyles += " border-blue-600 ring-2 ring-blue-200 bg-blue-50 text-blue-700";
              } else if (isAnswered) {
                baseStyles += " border-green-500 bg-green-500 text-white";
              } else {
                baseStyles += " border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQIndex(idx)}
                  className={baseStyles}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}