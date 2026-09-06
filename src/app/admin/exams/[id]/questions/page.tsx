"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { PlusCircle, Save, ArrowLeft, Trash2 } from "lucide-react";

export default function QuestionBuilder() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;

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
    setMarks(parseInt(e.target.value));
  }

  function handleQuestionTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuestionText(e.target.value);
  }

  function navigateToDashboard() {
    router.push("/admin/dashboard");
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
      toast.error(questionError.message);
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
        toast.error("Failed to save MCQ options.");
        setLoading(false);
        return;
      }
    }

    toast.success("Question added successfully!");
    
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
      toast.error("Failed to delete question");
    } else {
      toast.success("Question removed");
      fetchExistingQuestions();
    }
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newType = e.target.value as "MCQ" | "DESCRIPTIVE";
    setQuestionType(newType);
    setMarks(newType === "DESCRIPTIVE" ? 5 : 1);
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={navigateToDashboard}
            className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add Questions</h1>
        </div>

        <form onSubmit={handleAddQuestion} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={handleTypeChange}
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="DESCRIPTIVE">5-Mark Descriptive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
              <input
                type="number"
                min="1"
                required
                value={marks}
                onChange={handleMarksChange}
                className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
            <textarea
              required
              rows={3}
              value={questionText}
              onChange={handleQuestionTextChange}
              className="w-full px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Enter the question here..."
            ></textarea>
          </div>

          {questionType === "MCQ" && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700">Answer Options</label>
              {options.map(function renderOption(opt, index) {
                
                function onRadioChange() {
                  setCorrectOptionIndex(index);
                }
                
                function onTextChange(e: React.ChangeEvent<HTMLInputElement>) {
                  handleOptionChange(index, e.target.value);
                }

                return (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="correctOption"
                      checked={correctOptionIndex === index}
                      onChange={onRadioChange}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={onTextChange}
                      className={`flex-1 px-4 py-2 text-gray-900 bg-white border rounded-lg outline-none transition-colors ${
                        correctOptionIndex === index 
                          ? "border-green-500 bg-green-50" 
                          : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                      }`}
                      placeholder={`Option ${index + 1}`}
                    />
                  </div>
                );
              })}
              <p className="text-xs text-gray-500">Select the radio button next to the correct answer.</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              {loading ? "Saving..." : "Add Question to Exam"}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Question List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit max-h-[800px] overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
          <span>Added Questions</span>
          <span className="bg-blue-100 text-blue-800 text-sm py-1 px-3 rounded-full">
            {existingQuestions.length} Total
          </span>
        </h2>
        
        {existingQuestions.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            No questions added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {existingQuestions.map(function renderQuestion(q, i) {
              
              function onDeleteClick() {
                handleDeleteQuestion(q.id);
              }

              return (
                <div key={q.id} className="p-4 border border-gray-200 rounded-lg relative group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Q{i + 1} • {q.type}
                    </span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 py-1 px-2 rounded">
                      {q.marks} Marks
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{q.question_text}</p>
                  
                  <button 
                    onClick={onDeleteClick}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            <button 
              onClick={navigateToDashboard}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Finalize Exam
            </button>
          </div>
        )}
      </div>
    </div>
  );
}