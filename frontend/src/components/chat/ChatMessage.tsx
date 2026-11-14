import React from 'react';
import { Sprout, User } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../types';
import { MessageActions } from './MessageActions';

interface ChatMessageProps {
  message: ChatMessageType;
  isSpeaking: boolean;
  isSpeechSupported: boolean;
  onSpeak: () => void;
  onStopSpeak: () => void;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
  speechRate?: number;
  onSetSpeed?: (rate: number) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isSpeaking,
  isSpeechSupported,
  onSpeak,
  onStopSpeak,
  onRegenerate,
  isLastAssistantMessage,
  speechRate,
  onSetSpeed,
}) => {
  const isAssistant = message.role === 'assistant';

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Render text with basic markdown parsing (bold, lists)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold text formatting **word**
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Check if bullet point
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s*/, '') }}
          />
        );
      }

      // Check if numbered list item (e.g. 1. 2.)
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <li
            key={idx}
            className="ml-5 list-decimal my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s*/, '') }}
          />
        );
      }

      // Empty line -> space
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="my-1.5 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div
      className={`flex items-start gap-3 my-4 animate-fade-in ${
        isAssistant ? 'justify-start' : 'justify-end'
      }`}
    >
      {/* Assistant Avatar */}
      {isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <Sprout className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble */}
      <div
        className={`max-w-[88%] md:max-w-[78%] rounded-2xl p-4 shadow-2xs ${
          isAssistant
            ? 'bg-white border border-slate-200/80 rounded-tl-sm text-slate-800'
            : 'bg-forest-700 text-white rounded-tr-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-1">
          <span
            className={`text-xs font-bold tracking-tight ${
              isAssistant ? 'text-forest-800' : 'text-forest-100'
            }`}
          >
            {isAssistant ? 'GreenGrow Assistant' : 'You (Farmer)'}
          </span>
          <span
            className={`text-[11px] ${
              isAssistant ? 'text-slate-400' : 'text-forest-200'
            }`}
          >
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Plant / Crop Image Preview if attached */}
        {message.image && (
          <div className="my-2 rounded-xl overflow-hidden border border-white/30 bg-black/20 shadow-xs max-w-sm">
            <img
              src={
                message.image.startsWith('data:')
                  ? message.image
                  : `data:${message.imageMimeType || 'image/jpeg'};base64,${message.image}`
              }
              alt="Plant or crop photo"
              className="max-h-64 w-full object-cover cursor-pointer hover:opacity-95 transition"
              onClick={() => {
                const src = message.image?.startsWith('data:')
                  ? message.image
                  : `data:${message.imageMimeType || 'image/jpeg'};base64,${message.image}`;
                window.open(src, '_blank');
              }}
              title="Click to open full photo"
            />
            <div className="px-2.5 py-1.5 bg-forest-900/80 text-[11px] text-white font-medium flex items-center justify-between">
              <span className="flex items-center gap-1">🌱 Crop Photo Attached</span>
              <span className="text-[10px] text-forest-200">Tap to expand</span>
            </div>
          </div>
        )}

        {/* Text Content */}
        <div className="text-sm md:text-base break-words font-sans">
          {renderFormattedContent(message.content)}
        </div>

        {/* Action buttons (Copy, Listen, Regenerate) */}
        <MessageActions
          content={message.content}
          isAssistant={isAssistant}
          isSpeaking={isSpeaking}
          isSpeechSupported={isSpeechSupported}
          onSpeak={onSpeak}
          onStopSpeak={onStopSpeak}
          onRegenerate={onRegenerate}
          isLastAssistantMessage={isLastAssistantMessage}
          speechRate={speechRate}
          onSetSpeed={onSetSpeed}
        />
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};
