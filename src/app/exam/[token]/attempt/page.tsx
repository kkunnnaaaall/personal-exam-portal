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

  const [examStarted, setExamStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  
  const isSubmittedRef = useRef(isSubmitted);
  const examStartedRef = useRef(examStarted);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastViolationTimeRef = useRef<number>(0);

  useEffect(() => {
    isSubmittedRef.current = isSubmitted;
    examStartedRef.current = examStarted;
  }, [isSubmitted, examStarted]);

  useEffect(() => {
    if (token) fetchExamAndAttempt();
  }, [token]);

  useEffect(() => {
    if (loading || !attempt?.id) return;

    function handleViolation() {
      if (!examStartedRef.current || isSubmittedRef.current) return;
      const now = Date.now();
      if (now - lastViolationTimeRef.current < 2000) return;
      
      lastViolationTimeRef.current = now;
      setViolationCount((prev) => prev + 1);
    }

    function onVisibilityChange() { if (document.hidden) handleViolation(); }
    function onWindowBlur() { handleViolation(); }
    function onFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        handleViolation();
      } else setIsFullscreen(true);
    }

    function blockKeys(e: KeyboardEvent) {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I") || (e.ctrlKey && e.key === "c") || (e.ctrlKey && e.key === "v") || (e.metaKey && e.key === "c") || (e.metaKey && e.key === "v")) {
        e.preventDefault();
        toast.error("Doobaaa blocked shortcuts! No copying allowed, Doobiii.");
      }
    }

    function blockContextMenu(e: MouseEvent) { e.preventDefault(); }
    function blockCopyPaste(e: ClipboardEvent) { e.preventDefault(); }

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

  useEffect(() => {
    if (violationCount > 0 && violationCount < 3 && !isSubmitted) {
      setShowWarning(true);
      toast.error(`Nice try, Doobiii! Doobaaa is watching 👀 (${violationCount}/3)`);
    } else if (violationCount >= 3 && !isSubmitted && attempt?.id) {
      toast.error("3 strikes! Doobaaa auto-submitted your paper for rule breaches.");
      setShowWarning(false);
      finalizeSubmission();
    }
  }, [violationCount]);

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

  async function enterFullscreen() {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      setIsFullscreen(true);
      setExamStarted(true);
    } catch (err) {
      toast.error("Please allow full-screen mode to start the Doobaaa-Doobiii exam.");
    }
  }

  async function fetchExamAndAttempt() {
    try {
      setLoading(true);
      const { data: examData, error: examError } = await supabase.from("exams").select("*").eq("exam_token", token).single();
      if (examError || !examData) {
        toast.error("Exam not found or invalid token.");
        setLoading(false);
        return;
      }
      setExam(examData);
      setTimeLeft((examData.duration_minutes || examData.duration || 30) * 60);

      const { data: questionsData } = await supabase.from("questions").select("*, mcq_options(*)").eq("exam_id", examData.id);
      setQuestions(questionsData || []);

      const { data: attemptData } = await supabase.from("attempts").select("*").eq("exam_id", examData.id).maybeSingle();
      if (!attemptData) {
        const { data: newAttempt } = await supabase.from("attempts").insert({ exam_id: examData.id, status: "IN_PROGRESS", start_time: new Date().toISOString() }).select().single();
        if (newAttempt) setAttempt(newAttempt);
      } else {
        setAttempt(attemptData);
      }
    } catch (err) {
      console.error(err);
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
    const { error } = await supabase.from("answers").upsert({
      attempt_id: attempt.id, question_id: questionId, selected_option_id: optionId, text_answer: text, saved_at: new Date().toISOString(),
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
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: optionId, text_answer: null } }));
    saveAnswerToDatabase(questionId, optionId, null);
  }

  function handleDescriptiveChange(questionId: string, text: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { selected_option_id: null, text_answer: text } }));
    setSaveStatus("SAVING");
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => saveAnswerToDatabase(questionId, null, text), 1500);
  }

  async function handleSubmitExam() { await finalizeSubmission(); }
  async function handleAutoSubmit() { if (!attempt?.id || isSubmitted) return; await finalizeSubmission(); }

  async function finalizeSubmission() {
    if (!attempt?.id || isSubmitted) return;
    setIsSubmitted(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(err => console.log(err));
    const { error } = await supabase.from("attempts").update({ status: "SUBMITTED", submit_time: new Date().toISOString() }).eq("id", attempt.id);
    if (error) {
      toast.error("Error submitting exam.");
      setIsSubmitted(false);
    } else {
      toast.success("Exam submitted successfully!");
      router.push(`/exam/${token}/completed`);
    }
  }

  if (loading || !exam) return <div className="min-h-screen flex items-center justify-center bg-pink-50 font-medium text-pink-900">Loading Secure Exam Environment...</div>;

  if (!examStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-pink-100 p-10 text-center border border-pink-100">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Maximize className="w-10 h-10 text-pink-500" />
          </div>
          <h2 className="text-2xl font-black text-pink-950 mb-4">DOOBAA-DOOBIII Secure Vault</h2>
          <p className="text-gray-600 font-medium mb-8">
            This exam requires full-screen mode. Do not switch tabs, use keyboard shortcuts, or exit full-screen, or Doobaaa will record a violation strike!
          </p>
          <button onClick={enterFullscreen} className="w-full py-4 bg-[#FFB6C1] text-pink-950 font-black rounded-2xl hover:bg-pink-300 transition-all shadow-lg shadow-pink-200">
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
    <div className="min-h-screen flex flex-col bg-pink-50/50 select-none selection:bg-[#FFB6C1]/40">
      
      {showWarning && violationCount < 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pink-950/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center border border-pink-100">
            <AlertTriangle className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-pink-950 mb-2">Caught by Doobaaa! 🚨</h2>
            <p className="text-gray-600 font-medium mb-6 text-sm">
              You exited full-screen or clicked outside the exam. This is a strict rule violation.
              <br /><br />
              <span className="text-lg text-pink-600 font-black tracking-wide bg-pink-50 px-4 py-2 rounded-xl">
                VIOLATION {violationCount} OF 3
              </span>
              <br /><br />
              If you reach 3 violations, Doobaaa will automatically submit your paper.
            </p>
            <button onClick={() => { setShowWarning(false); enterFullscreen(); }} className="w-full py-4 bg-[#FFB6C1] text-pink-950 font-black rounded-xl hover:bg-pink-300 transition-all">
              I Understand, Return to Exam
            </button>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md border-b border-pink-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_rgba(244,114,182,0.8)]" />
            <span className="text-xs font-black tracking-widest text-pink-500">DOOBAA-DOOBIII PORTAL</span>
          </div>
          <h1 className="text-xl font-black text-pink-950">{exam.title}</h1>
          <p className="text-sm font-medium text-gray-500 mt-0.5">Violations Recorded: <span className={violationCount > 0 ? "text-pink-600 font-bold" : ""}>{violationCount}/3</span></p>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="text-sm hidden md:block">
            {saveStatus === "SAVING" && <span className="text-amber-500 animate-pulse font-bold text-xs tracking-wide">Saving...</span>}
            {saveStatus === "SAVED" && <span className="text-pink-500 font-bold text-xs flex items-center tracking-wide"><CheckCircle className="w-4 h-4 mr-1"/> Saved</span>}
          </div>
          
          <div className={`flex items-center px-5 py-2.5 rounded-xl font-black text-lg ${isTimeWarning ? "bg-red-100 text-red-700 animate-pulse" : "bg-[#FFB6C1]/20 text-pink-700 border border-pink-200"}`}>
            <Clock className="w-5 h-5 mr-2" />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>

          <button onClick={handleSubmitExam} className="px-6 py-3 bg-[#FFB6C1] text-pink-950 font-black rounded-xl hover:bg-pink-300 transition-all shadow-md shadow-pink-200">
            Submit Exam
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6">
        <main className="flex-1 bg-white rounded-3xl shadow-sm border border-pink-100 p-8 flex flex-col">
          {currentQ ? (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-pink-50">
                <span className="text-sm font-black text-pink-400 uppercase tracking-widest">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <span className="text-sm font-bold bg-[#FFB6C1]/20 text-pink-700 py-1.5 px-4 rounded-full">
                  {currentQ.marks || 1} Marks
                </span>
              </div>

              <div className="flex-1">
                <p className="text-lg text-gray-900 font-bold mb-8 whitespace-pre-wrap leading-relaxed">
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
                          className={`flex items-center p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                            isSelected ? "border-[#FFB6C1] bg-pink-50/50 shadow-sm" : "border-gray-100 hover:border-pink-200 hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${currentQ.id}`}
                            value={optId}
                            checked={isSelected}
                            onChange={() => handleMCQSelection(currentQ.id, optId)}
                            className="w-5 h-5 text-pink-500 border-gray-300 focus:ring-pink-400 mr-4"
                          />
                          <span className={`font-medium ${isSelected ? 'text-pink-950' : 'text-gray-700'}`}>{optText}</span>
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
                      className="flex-1 w-full p-5 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FFB6C1] focus:ring-4 focus:ring-pink-50 transition-all resize-none font-medium text-gray-800"
                      onPaste={(e) => { e.preventDefault(); toast.error("Pasting is disabled."); }}
                    ></textarea>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-gray-400 font-medium">No questions available for this exam.</div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-pink-50">
            <button onClick={() => setCurrentQIndex((idx) => Math.max(0, idx - 1))} disabled={currentQIndex === 0} className="flex items-center px-5 py-3 border-2 border-gray-100 rounded-xl font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all">
              <ChevronLeft className="w-5 h-5 mr-1" /> Previous
            </button>
            
            {!isLastQuestion ? (
              <button onClick={() => setCurrentQIndex((idx) => Math.min(questions.length - 1, idx + 1))} className="flex items-center px-6 py-3 bg-[#FFB6C1] text-pink-950 font-black rounded-xl hover:bg-pink-300 transition-all shadow-md shadow-pink-200">
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button onClick={handleSubmitExam} className="flex items-center px-6 py-3 bg-[#FFB6C1] text-pink-950 font-black rounded-xl hover:bg-pink-300 transition-all shadow-md shadow-pink-200">
                Submit Exam
              </button>
            )}
          </div>
        </main>

        <aside className="w-full md:w-72 bg-white rounded-3xl shadow-sm border border-pink-100 p-6 h-fit">
          <h3 className="text-xs font-black text-pink-400 mb-5 uppercase tracking-widest">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2.5">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id]?.selected_option_id || (answers[q.id]?.text_answer && answers[q.id].text_answer.trim().length > 0);
              const isCurrent = currentQIndex === idx;
              
              let baseStyles = "w-10 h-10 rounded-xl font-bold text-sm flex items-center justify-center border-2 transition-all";
              if (isCurrent) {
                baseStyles += " border-[#FFB6C1] bg-[#FFB6C1] text-pink-950 shadow-md shadow-pink-200";
              } else if (isAnswered) {
                baseStyles += " border-[#FFB6C1] bg-[#FFB6C1]/20 text-pink-800";
              } else {
                baseStyles += " border-gray-100 bg-gray-50 text-gray-500 hover:border-pink-200";
              }

              return (
                <button key={q.id} onClick={() => setCurrentQIndex(idx)} className={baseStyles}>
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