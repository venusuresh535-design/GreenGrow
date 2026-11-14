import React from 'react';
import { Send, X, Edit3, Volume2 } from 'lucide-react';
import { Button } from '../common/Button';

interface SpeechRecognitionStatusProps {
  isListening: boolean;
  isTranscribing?: boolean;
  transcript: string;
  interimTranscript: string;
  languageName: string;
  onSend: (text: string) => void;
  onEdit: (text: string) => void;
  onCancel: () => void;
  onStop: () => void;
}

export const SpeechRecognitionStatus: React.FC<SpeechRecognitionStatusProps> = ({
  isListening,
  isTranscribing,
  transcript,
  interimTranscript,
  languageName,
  onSend,
  onEdit,
  onCancel,
  onStop,
}) => {
  const displayText = (transcript + ' ' + interimTranscript).trim();

  if (!isListening && !isTranscribing && !displayText) return null;

  return (
    <div className="fixed bottom-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-forest-600/30 p-4 transition-all animate-bounce-short">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isTranscribing ? (
            <div className="flex items-center gap-2 text-forest-700">
              <span className="w-3.5 h-3.5 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-forest-700 uppercase tracking-wider">
                Transcribing in {languageName} via Gemini AI...
              </span>
            </div>
          ) : isListening ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                Listening in {languageName}... (Speak now)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-forest-700">
              <Volume2 className="w-4 h-4" />
              <span className="text-xs font-semibold">Speech Recognized</span>
            </div>
          )}
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="min-h-[52px] max-h-36 overflow-y-auto mb-3 text-slate-800 text-base font-medium px-1 leading-relaxed">
        {isTranscribing ? (
          <span className="text-forest-600 italic flex items-center gap-2">
            Processing your speech into {languageName} script...
          </span>
        ) : displayText ? (
          displayText
        ) : (
          <span className="text-slate-400 italic">
            Speak your farming question now. Tap "Done Speaking" when finished.
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 gap-2">
        {isListening ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onStop}
            className="text-rose-600 border-rose-300 hover:bg-rose-50"
          >
            Done Speaking
          </Button>
        ) : isTranscribing ? (
          <span className="text-xs text-slate-400 font-medium">Please wait...</span>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(displayText)}
            icon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit in Textbox
          </Button>
        )}

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={isTranscribing}>
            Discard
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!displayText || isTranscribing}
            onClick={() => onSend(displayText)}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Send Question
          </Button>
        </div>
      </div>
    </div>
  );
};
