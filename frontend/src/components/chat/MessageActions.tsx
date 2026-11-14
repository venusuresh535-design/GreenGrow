import React, { useState } from 'react';
import { Copy, Check, RotateCcw } from 'lucide-react';
import { ListenButton } from '../voice/ListenButton';

interface MessageActionsProps {
  content: string;
  isAssistant: boolean;
  isSpeaking: boolean;
  isSpeechSupported: boolean;
  onSpeak: () => void;
  onStopSpeak: () => void;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
  speechRate?: number;
  onSetSpeed?: (rate: number) => void;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  content,
  isAssistant,
  isSpeaking,
  isSpeechSupported,
  onSpeak,
  onStopSpeak,
  onRegenerate,
  isLastAssistantMessage = false,
  speechRate = 1.0,
  onSetSpeed,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy to clipboard failed:', err);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100/80 flex-wrap">
      {/* Listen Audio Button & Speed Selector (Assistant only) */}
      {isAssistant && (
        <div className="inline-flex items-center gap-1.5">
          <ListenButton
            text={content}
            isSpeaking={isSpeaking}
            isSupported={isSpeechSupported}
            onSpeak={onSpeak}
            onStop={onStopSpeak}
          />

          {/* Quick Talking Speed Toggle */}
          {onSetSpeed && (
            <button
              type="button"
              onClick={() => {
                const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
                const currentIndex = speeds.findIndex((s) => Math.abs(s - speechRate) < 0.05);
                const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
                onSetSpeed(nextSpeed);
              }}
              className="text-[11px] font-bold px-2 py-1 bg-forest-50 hover:bg-forest-100/80 text-forest-800 rounded-lg border border-forest-200 transition active:scale-95 cursor-pointer shadow-2xs"
              title={`Talking speed: ${speechRate}x (click to change)`}
            >
              {speechRate}x
            </button>
          )}
        </div>
      )}

      {/* Copy Response Button */}
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition"
        title="Copy message to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-forest-600" />
            <span className="text-forest-700 font-medium">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>

      {/* Regenerate Button (Last assistant response only) */}
      {isAssistant && isLastAssistantMessage && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-forest-700 py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition"
          title="Regenerate Gemini answer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Regenerate</span>
        </button>
      )}
    </div>
  );
};
