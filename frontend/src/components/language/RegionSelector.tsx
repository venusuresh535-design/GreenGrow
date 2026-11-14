import React from 'react';
import { MapPin } from 'lucide-react';

interface RegionSelectorProps {
  value: string;
  onChange: (region: string) => void;
  placeholder?: string;
}

export const RegionSelector: React.FC<RegionSelectorProps> = ({
  value,
  onChange,
  placeholder = 'e.g. Karnataka, California, Punjab, Bavaria...',
}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-forest-700" />
        State / Province / District (Optional Context)
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 transition text-slate-800 placeholder:text-slate-400"
      />
    </div>
  );
};
