import React from 'react';
import { Sprout } from 'lucide-react';

export const TypingIndicator: React.FC<{ languageName?: string }> = ({ languageName }) => {
  return (
    <div className="flex items-start gap-3 my-4 animate-fade-in">
      <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sprout className="w-4 h-4 animate-bounce" />
      </div>
      <div className="bg-white border border-forest-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-xs flex items-center gap-2">
        <span className="text-xs font-semibold text-forest-800">
          GreenGrow is preparing advice{languageName ? ` in ${languageName}` : ''}...
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse delay-150" />
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse delay-300" />
        </div>
      </div>
    </div>
  );
};
