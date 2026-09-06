// src/app/exam/[token]/submitted/page.tsx
"use client";

import { CheckCircle, Lock } from "lucide-react";

export default function ExamSubmitted() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Submitted Successfully</h1>
        <p className="text-gray-600 mb-8">
          Your answers have been securely saved and submitted for evaluation. You can no longer access the examination portal.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 flex items-start space-x-3 text-left border border-gray-200">
          <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <span className="font-bold text-gray-700 block mb-1">What happens next?</span>
            Multiple-choice questions will be evaluated automatically. Your examiner will manually review your descriptive answers before publishing the final result.
          </div>
        </div>

        <button 
          onClick={function closeWindow() { window.close(); }}
          className="mt-8 px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors w-full"
        >
          Close Window
        </button>
      </div>
    </div>
  );
}