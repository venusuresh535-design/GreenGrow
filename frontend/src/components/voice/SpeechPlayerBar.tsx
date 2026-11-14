import React from 'react';
import { Volume2, Pause, Play, Square, Gauge } from 'lucide-react';

interface SpeechPlayerBarProps {
  isSpeaking: boolean;
  isPaused: boolean;
  speechRate: number;
  onSetSpeed: (rate: number) => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const SPEED_OPTIONS = [
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 2.0, label: '2x' },
];

export const SpeechPlayerBar: React.FC<SpeechPlayerBarProps> = ({
  isSpeaking,
  isPaused,
  speechRate,
  onSetSpeed,
  onPause,
  onResume,
  onStop,
}) => {
  if (!isSpeaking) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 z-40 max-w-lg bg-slate-900/95 text-white p-3 rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md animate-fade-in flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Speaking Indicator */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center flex-shrink-0 text-white">
          <Volume2 className="w-4 h-4 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
            <span>GreenGrow Speaking</span>
            {isPaused && (
              <span className="text-[10px] bg-amber-500/80 text-white px-1.5 py-0.2 rounded-md font-semibold">
                Paused
              </span>
            )}
          </p>
          <p className="text-[10px] text-slate-400 truncate">
            Speed: <span className="text-emerald-400 font-bold">{speechRate}x</span>
          </p>
        </div>
      </div>

      {/* Speed Selector Pills */}
      <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
        <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1 mr-0.5 hidden xs:inline" />
        {SPEED_OPTIONS.map((opt) => {
          const isActive = Math.abs(speechRate - opt.value) < 0.05;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSetSpeed(opt.value)}
              className={`px-2 py-0.5 rounded-lg text-xs font-bold transition active:scale-95 ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title={`Change speech speed to ${opt.label}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Playback Controls (Pause / Resume / Stop) */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          type="button"
          onClick={isPaused ? onResume : onPause}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition active:scale-95"
          title={isPaused ? 'Resume speaking' : 'Pause speaking'}
        >
          {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
        </button>
        <button
          type="button"
          onClick={onStop}
          className="p-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition active:scale-95"
          title="Stop speaking"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
};
