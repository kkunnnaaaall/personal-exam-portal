// src/app/admin/exams/[id]/questions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { Plus, Save, ArrowLeft, Trash2 } from "lucide-react";

export default function QuestionBuilder() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState<any[]>([]);
  
  const [questionType, setQuestionType] = useState<"MCQ" | "DESCRIPTIVE">("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [marks, setMarks] = useState(1);
  
  // MCQ specific state
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);

  useEffect(function loadQuestions() {
    fetchExistingQuestions();
  }, [examId]);

  async function fetchExistingQuestions() {
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("exam_id", examId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      setExistingQuestions(data);
    }
  }

  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function handleMarksChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMarks(parseInt(e.target.value) || 1);
  }

  function handleQuestionTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuestionText(e.target.value);
  }

  function navigateToDashboard() {
    router.push("/admin/dashboard");
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value as "MCQ" | "DESCRIPTIVE";
    setQuestionType(newType);
    setMarks(newType === "DESCRIPTIVE" ? 5 : 1);
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const orderIndex = existingQuestions.length + 1;

    // 1. Insert the question
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .insert([
        {
          exam_id: examId,
          type: questionType,
          question_text: questionText,
          marks: marks,
          order_index: orderIndex,
        },
      ])
      .select()
      .single();

    if (questionError) {
      console.error(questionError);
      toast.error(questionError.message || "Failed to add question");
      setLoading(false);
      return;
    }

    // 2. If it is an MCQ, insert the options
    if (questionType === "MCQ" && questionData) {
      const mcqOptionsData = options.map(function mapOptions(opt, index) {
        return {
          question_id: questionData.id,
          option_text: opt,
          is_correct: index === correctOptionIndex,
        };
      });

      const { error: optionsError } = await supabase
        .from("mcq_options")
        .insert(mcqOptionsData);

      if (optionsError) {
        console.error(optionsError);
        toast.error("Failed to save MCQ options.");
        await supabase.from("questions").delete().eq("id", questionData.id); // Rollback
        setLoading(false);
        return;
      }
    }

    toast.success("Challenge added successfully!");
    
    // Reset form
    setQuestionText("");
    setOptions(["", "", "", ""]);
    setCorrectOptionIndex(0);
    fetchExistingQuestions();
    setLoading(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (error) {
      toast.error("Failed to delete challenge.");
    } else {
      toast.success("Challenge removed from vault.");
      fetchExistingQuestions();
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto selection:bg-[#e30202]/30">
      <button 
        onClick={navigateToDashboard} 
        className="flex items-center text-zinc-400 hover:text-white font-bold text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Command Center
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-8">
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-widest border-b border-white/5 pb-4">Configure Vault Challenge</h2>
          
          <form onSubmit={handleAddQuestion} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Question Type</label>
                <select
                  value={questionType}
                  onChange={handleTypeChange}
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium"
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="DESCRIPTIVE">5-Mark Descriptive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Marks</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={marks}
                  onChange={handleMarksChange}
                  className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Question Text</label>
              <textarea
                required
                rows={3}
                value={questionText}
                onChange={handleQuestionTextChange}
                placeholder="Enter the challenge details here..."
                className="w-full px-4 py-3.5 bg-zinc-950/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-2 focus:ring-[#e30202]/20 outline-none transition-all font-medium resize-none"
              ></textarea>
            </div>

            {questionType === "MCQ" && (
              <div className="space-y-3 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4">Answer Options (Select the correct one)</label>
                {options.map(function renderOption(opt, index) {
                  
                  function onRadioChange() {
                    setCorrectOptionIndex(index);
                  }
                  
                  function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
                    handleOptionChange(index, e.target.value);
                  }

                  const isCorrect = correctOptionIndex === index;

                  return (
                    <div key={index} className={`flex items-center space-x-4 p-2 rounded-xl transition-all ${isCorrect ? 'bg-[#e30202]/10 border border-[#e30202]/30' : 'border border-transparent'}`}>
                      <input
                        type="radio"
                        name="correctOption"
                        checked={isCorrect}
                        onChange={onRadioChange}
                        className="w-5 h-5 text-[#e30202] bg-zinc-900 border-zinc-700 focus:ring-[#e30202]"
                      />
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={onTextChange}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 px-4 py-2.5 bg-zinc-950/50 border border-white/10 rounded-lg text-white placeholder-zinc-600 focus:border-[#e30202]/50 focus:ring-1 focus:ring-[#e30202]/50 outline-none transition-all font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-4 bg-[#e30202] hover:bg-red-700 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-[0_0_15px_rgba(227,2,2,0.4)] mt-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              {loading ? "Encrypting..." : "Add Challenge to Vault"}
            </button>
          </form>
        </div>

        {/* Right Column: Question List */}
        <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-6 h-fit max-h-[800px] flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4 shrink-0">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Vault Contents</h3>
            <span className="bg-[#e30202]/20 text-[#e30202] text-xs font-bold px-3 py-1 rounded-full border border-[#e30202]/30">
              {existingQuestions.length} Total
            </span>
          </div>
          
          {existingQuestions.length === 0 ? (
            <div className="text-center py-10 text-zinc-600 font-medium border-2 border-dashed border-white/5 rounded-2xl">
              No challenges deployed yet.
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto pr-2 mb-6 flex-1">
              {existingQuestions.map(function renderQuestion(q, i) {
                
                function onDeleteClick() {
                  handleDeleteQuestion(q.id);
                }

                return (
                  <div key={q.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors relative group">
                    <div className="flex justify-between items-start mb-2 pr-8">
                      <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Q{i + 1} • {q.type}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {q.marks} M
                      </span>
                    </div>
                    <p className="text-sm text-zinc-200 font-medium line-clamp-2">{q.question_text}</p>
                    
                    <button 
                      onClick={onDeleteClick}
                      className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Challenge"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button 
            onClick={navigateToDashboard}
            className="w-full shrink-0 flex items-center justify-center px-4 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 rounded-xl transition-colors font-black"
          >
            <Save className="w-5 h-5 mr-2" />
            Finalize Vault Sequence
          </button>
        </div>
      </div>
    </div>
  );
}