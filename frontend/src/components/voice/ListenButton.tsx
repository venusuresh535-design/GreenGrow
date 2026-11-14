import React from 'react';
import { Volume2, Square, VolumeX } from 'lucide-react';

interface ListenButtonProps {
  text: string;
  isSpeaking: boolean;
  isSupported: boolean;
  onSpeak: () => void;
  onStop: () => void;
}

export const ListenButton: React.FC<ListenButtonProps> = ({
  isSpeaking,
  isSupported,
  onSpeak,
  onStop,
}) => {
  if (!isSupported) {
    return (
      <span
        title="Speech synthesis is not supported on this browser"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 py-1 px-2.5 bg-slate-50 rounded-lg cursor-not-allowed"
      >
        <VolumeX className="w-3.5 h-3.5" />
        Audio Unavailable
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={isSpeaking ? onStop : onSpeak}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-lg transition-all shadow-sm ${
        isSpeaking
          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-300 animate-pulse'
          : 'bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200 hover:border-forest-300'
      }`}
      title={isSpeaking ? 'Stop listening' : 'Listen to this farming answer'}
    >
      {isSpeaking ? (
        <>
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop Audio</span>
        </>
      ) : (
        <>
          <Volume2 className="w-3.5 h-3.5 text-forest-700" />
          <span>Listen</span>
        </>
      )}
    </button>
  );
};
