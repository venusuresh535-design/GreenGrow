import React from 'react';
import { Globe } from 'lucide-react';

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  countries: string[];
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  countries,
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-forest-700" />
        Farming Country (Optional Context)
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 transition text-slate-800"
      >
        <option value="">-- All / Not specified --</option>
        {countries.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  );
};
