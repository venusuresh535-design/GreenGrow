import React, { useState } from 'react';
import { AGRICULTURE_CATEGORIES } from '../../data/categories';
import { AgricultureCategory } from '../../types';
import { CategoryQuestions } from './CategoryQuestions';

interface AgricultureCategoryCardsProps {
  onSelectQuestion: (question: string) => void;
}

export const AgricultureCategoryCards: React.FC<AgricultureCategoryCardsProps> = ({
  onSelectQuestion,
}) => {
  const [activeCategory, setActiveCategory] = useState<AgricultureCategory | null>(null);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
          <span>🌾</span> Picture Topics for Quick Advice
        </h3>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Tap any card to see questions
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {AGRICULTURE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className="flex flex-col items-center sm:items-start p-4 bg-white hover:bg-forest-50/50 rounded-2xl border-2 border-slate-200/80 hover:border-forest-500/80 shadow-sm hover:shadow-md transition-all duration-200 text-left active:scale-[0.98] group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-50 to-forest-100/80 border border-forest-200 flex items-center justify-center text-2xl mb-2.5 group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <span className="font-bold text-slate-900 text-sm md:text-base leading-tight group-hover:text-forest-800 transition">
              {cat.title}
            </span>
            <span className="text-xs text-slate-500 line-clamp-2 mt-1 hidden sm:block">
              {cat.description}
            </span>
            <span className="mt-2 text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full inline-block group-hover:bg-forest-100">
              {cat.questions.length} Questions →
            </span>
          </button>
        ))}
      </div>

      {/* Questions Modal for Selected Category */}
      {activeCategory && (
        <CategoryQuestions
          category={activeCategory}
          onClose={() => setActiveCategory(null)}
          onSelectQuestion={(q) => {
            setActiveCategory(null);
            onSelectQuestion(q);
          }}
        />
      )}
    </div>
  );
};
