import React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  size?: 'md' | 'lg';
  className?: string;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isSupported,
  onStart,
  onStop,
  size = 'lg',
  className = '',
}) => {
  if (!isSupported) {
    return (
      <button
        type="button"
        title="Voice input is not supported in this browser. Please type your question."
        className="p-3 text-slate-300 hover:text-slate-400 bg-slate-100 rounded-full cursor-not-allowed transition"
        disabled
      >
        <MicOff className="w-6 h-6" />
      </button>
    );
  }

  const dimensions =
    size === 'lg'
      ? 'w-16 h-16 min-w-[64px] min-h-[64px]'
      : 'w-12 h-12 min-w-[48px] min-h-[48px]';

  const iconSize = size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Pulsing rings when actively listening */}
      {isListening && (
        <>
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
          <span className="absolute -inset-2 rounded-full border-2 border-rose-500 animate-pulse" />
        </>
      )}

      <button
        type="button"
        onClick={isListening ? onStop : onStart}
        aria-label={isListening ? 'Stop recording voice' : 'Speak farming question'}
        title={isListening ? 'Stop recording voice' : 'Speak your question'}
        className={`${dimensions} rounded-full flex items-center justify-center transition-all duration-300 shadow-md transform active:scale-95 focus:outline-none focus:ring-4 ${
          isListening
            ? 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-300'
            : 'bg-forest-700 hover:bg-forest-800 text-white hover:shadow-lg focus:ring-forest-300'
        } ${className}`}
      >
        {isListening ? (
          <Square className={`${iconSize} fill-current`} />
        ) : (
          <Mic className={`${iconSize}`} />
        )}
      </button>
    </div>
  );
};
