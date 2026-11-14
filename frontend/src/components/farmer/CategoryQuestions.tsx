import React from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { AgricultureCategory } from '../../types';

interface CategoryQuestionsProps {
  category: AgricultureCategory;
  onClose: () => void;
  onSelectQuestion: (question: string) => void;
}

export const CategoryQuestions: React.FC<CategoryQuestionsProps> = ({
  category,
  onClose,
  onSelectQuestion,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 md:p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-forest-50 rounded-2xl border border-forest-100">
              {category.icon}
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{category.title}</h3>
              <p className="text-xs text-slate-500">Tap a question to ask Gemini AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-2.5 overflow-y-auto flex-1">
          {category.questions.map((question, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectQuestion(question)}
              className="w-full p-3.5 bg-slate-50 hover:bg-forest-50 border border-slate-200 hover:border-forest-400 rounded-2xl text-left text-sm text-slate-800 hover:text-forest-900 transition flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-start gap-2.5 pr-2">
                <Sparkles className="w-4 h-4 text-forest-600 flex-shrink-0 mt-0.5 group-hover:rotate-12 transition-transform" />
                <span className="font-medium">{question}</span>
              </div>
              <span className="p-1.5 bg-white group-hover:bg-forest-700 text-slate-400 group-hover:text-white rounded-xl shadow-xs transition-colors flex-shrink-0">
                <Send className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-1.5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
