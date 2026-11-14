import React from 'react';
import { Search, X } from 'lucide-react';

interface LanguageSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const LanguageSearch: React.FC<LanguageSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by language or state (e.g. Kannada, Hindi, Spanish)...',
}) => {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
