import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Camera, X } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';
import { ProcessedImage } from '../../utils/imageUtils';

interface ChatInputProps {
  value?: string;
  onChange?: (text: string) => void;
  onSendMessage: (text: string, photo?: ProcessedImage) => void;
  isLoading: boolean;
  isListening: boolean;
  isSpeechSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onOpenLanguageModal?: () => void;
  onOpenPhotoModal?: () => void;
  attachedPhoto?: ProcessedImage | null;
  onRemovePhoto?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSendMessage,
  isLoading,
  isListening,
  isSpeechSupported,
  onStartListening,
  onStopListening,
  onOpenLanguageModal,
  onOpenPhotoModal,
  attachedPhoto,
  onRemovePhoto,
}) => {
  const { selectedLanguage } = usePreferences();
  const [internalText, setInternalText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const text = value !== undefined ? value : internalText;

  const handleTextChange = (newVal: string) => {
    if (value === undefined) {
      setInternalText(newVal);
    }
    if (onChange) {
      onChange(newVal);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const canSubmit = (text.trim().length > 0 || Boolean(attachedPhoto)) && !isLoading;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    onSendMessage(text.trim(), attachedPhoto || undefined);
    handleTextChange('');
    if (onRemovePhoto) onRemovePhoto();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* Quick Language Switcher Banner above Input */}
      {onOpenLanguageModal && (
        <div className="flex items-center justify-between px-2 text-xs">
          <button
            type="button"
            onClick={onOpenLanguageModal}
            className="inline-flex items-center gap-1.5 font-semibold text-forest-900 bg-forest-50 hover:bg-forest-100 px-3 py-1 rounded-xl border border-forest-200 transition active:scale-95 shadow-2xs"
            title="Change AI conversation language"
          >
            <span>🌐 AI Speaks &amp; Answers in:</span>
            <span className="font-bold underline decoration-forest-400">
              {selectedLanguage.name} ({selectedLanguage.nativeName})
            </span>
            <span className="text-forest-600 font-bold">▾</span>
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Tap button to switch regional language
          </span>
        </div>
      )}

      {/* Attached Photo Preview Strip */}
      {attachedPhoto && (
        <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-2xl mx-1 animate-fade-in shadow-2xs">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-forest-600 flex-shrink-0 shadow-sm bg-black">
            <img
              src={attachedPhoto.dataUrl}
              alt="Attached crop"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-forest-900 truncate">
                🌱 Crop Photo Attached
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded-full font-bold">
                Ready for Diagnosis
              </span>
            </div>
            <p className="text-[11px] text-slate-600 truncate mt-0.5">
              Click Send to analyze, or type optional details below.
            </p>
          </div>
          {onRemovePhoto && (
            <button
              type="button"
              onClick={onRemovePhoto}
              title="Remove attached photo"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 bg-white rounded-3xl p-2.5 shadow-lg border border-slate-200/90 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20 transition-all"
      >
        {/* Camera / Photo Button */}
        {onOpenPhotoModal && (
          <div className="flex-shrink-0 mb-1">
            <button
              type="button"
              onClick={onOpenPhotoModal}
              disabled={isLoading}
              title="Take plant photo or upload crop image for AI diagnosis"
              className="p-2.5 rounded-2xl bg-forest-100 text-forest-800 hover:bg-forest-200 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Microphone toggle inside input bar */}
        <div className="flex-shrink-0 mb-1">
          <button
            type="button"
            onClick={isListening ? onStopListening : onStartListening}
            disabled={!isSpeechSupported || isLoading}
            title={
              !isSpeechSupported
                ? 'Voice input not supported in this browser'
                : isListening
                  ? 'Stop listening'
                  : `Speak in ${selectedLanguage.name}`
            }
            className={`p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
              !isSpeechSupported
                ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                : isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-forest-100 text-forest-800 hover:bg-forest-200 active:scale-95'
            }`}
          >
            {isListening ? (
              <Square className="w-5 h-5 fill-current" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Text input area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachedPhoto
              ? `Optional: Add notes (e.g. leaves turning yellow, seen in tomato field)... or just tap Send!`
              : `Ask GreenGrow in ${selectedLanguage.name} (${selectedLanguage.nativeName})...`
          }
          disabled={isLoading}
          className="flex-1 max-h-32 py-2 px-2 resize-none bg-transparent text-sm md:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label="Send question or photo"
          className="p-3 bg-forest-700 hover:bg-forest-800 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-2xl shadow-sm transition-all duration-200 active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed flex-shrink-0 mb-1 cursor-pointer"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
