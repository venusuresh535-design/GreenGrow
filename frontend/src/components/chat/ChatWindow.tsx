import React, { useEffect, useRef } from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ErrorMessage } from '../common/ErrorMessage';
import { useSpeechSynthesis } from '../../hooks/useSpeechSynthesis';
import { usePreferences } from '../../context/PreferencesContext';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRegenerate?: () => void;
  speechSynthesis?: {
    speak: (text: string, speechCode?: string, id?: string) => void;
    stop: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
    currentUtteranceId: string | null;
    speechRate?: number;
    setSpeechRate?: (rate: number) => void;
  };
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  error,
  onRetry,
  onRegenerate,
  speechSynthesis: externalSpeech,
}) => {
  const { selectedLanguage } = usePreferences();
  const bottomRef = useRef<HTMLDivElement>(null);
  const internalSpeech = useSpeechSynthesis();

  const {
    speak,
    stop,
    isSpeaking,
    isSupported,
    currentUtteranceId,
    speechRate,
    setSpeechRate,
  } = externalSpeech || internalSpeech;

  // Auto-scroll to bottom on messages update or loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Find index of the last assistant message
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 max-w-4xl w-full mx-auto">
      {messages.map((msg, index) => {
        const msgId = msg.id || `msg-${index}`;
        const isThisSpeaking = isSpeaking && currentUtteranceId === msgId;

        return (
          <ChatMessage
            key={msgId}
            message={msg}
            isSpeaking={isThisSpeaking}
            isSpeechSupported={isSupported}
            onSpeak={() => speak(msg.content, selectedLanguage.speechCode || 'en-US', msgId)}
            onStopSpeak={stop}
            onRegenerate={onRegenerate}
            isLastAssistantMessage={index === lastAssistantIndex}
            speechRate={speechRate}
            onSetSpeed={setSpeechRate}
          />
        );
      })}

      {/* Loading indicator */}
      {isLoading && <TypingIndicator languageName={selectedLanguage.name} />}

      {/* Error state */}
      {error && (
        <div className="my-4">
          <ErrorMessage message={error} onRetry={onRetry} />
        </div>
      )}

      <div ref={bottomRef} className="h-4" />
    </div>
  );
};
