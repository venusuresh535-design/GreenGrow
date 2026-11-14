import React, { useState, useEffect, useCallback } from 'react';
import { ChatLayout } from '../components/layout/ChatLayout';
import { FarmerHomeScreen } from '../components/farmer/FarmerHomeScreen';
import { ChatWindow } from '../components/chat/ChatWindow';
import { ChatInput } from '../components/chat/ChatInput';
import { CameraModal } from '../components/camera/CameraModal';
import { UserGuideModal } from '../components/guide/UserGuideModal';
import { SpeechRecognitionStatus } from '../components/voice/SpeechRecognitionStatus';
import { SpeechPlayerBar } from '../components/voice/SpeechPlayerBar';
import { OnboardingModal } from '../components/farmer/OnboardingModal';
import { LanguageSelectorModal } from '../components/language/LanguageSelectorModal';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ChatMessage, Conversation } from '../types';
import { ProcessedImage } from '../utils/imageUtils';

export const ChatPage: React.FC = () => {
  const { selectedLanguage, country, region } = usePreferences();
  const { token } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [attachedPhoto, setAttachedPhoto] = useState<ProcessedImage | null>(null);

  // Check if first-time user to automatically present the interactive guide
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('greengrow_guide_seen');
    if (!hasSeenGuide) {
      setIsGuideModalOpen(true);
    }
  }, []);

  // Speech output synthesizer
  const speechSynthesis = useSpeechSynthesis();
  const lastInputWasVoiceRef = React.useRef<boolean>(false);

  // Compute best locale speech tag (e.g. en-IN for Indian English accent)
  const effectiveSpeechCode = React.useMemo(() => {
    if (selectedLanguage.code === 'en' && (!country || country === 'India' || country === 'IN')) {
      return 'en-IN';
    }
    return selectedLanguage.speechCode || 'en-US';
  }, [selectedLanguage, country]);

  // Speech Recognition hook (Dual engine: Web Speech + Gemini Audio STT)
  const {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    isSupported: isSpeechSupported,
    error: speechError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    lang: effectiveSpeechCode,
    language: selectedLanguage,
    token,
    onResult: (finalText) => {
      setInputText(finalText);
    },
    onInterim: (interim) => {
      if (interim) {
        setInputText(() => (transcript ? `${transcript} ${interim}` : interim));
      }
    },
  });

  // Load conversation list on mount
  const loadConversations = useCallback(async () => {
    try {
      const list = await api.getConversations(token);
      setConversations(list);
    } catch (err: any) {
      console.warn('Could not load conversations:', err.message);
    }
  }, [token]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load selected conversation
  const handleSelectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const conv = await api.getConversation(id, token);
      if (conv) {
        setActiveConversationId(conv.id);
        setMessages(conv.messages || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open conversation.');
    } finally {
      setIsLoading(false);
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id, token);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete conversation.');
    }
  };

  // Send message (text, voice, or crop photo)
  const handleSendMessage = async (
    text: string,
    isVoice: boolean = false,
    photo?: ProcessedImage
  ) => {
    const photoToSend = photo || attachedPhoto;
    if ((!text.trim() && !photoToSend) || isLoading) return;

    lastInputWasVoiceRef.current = isVoice;
    speechSynthesis.stop();
    setError(null);

    const userMessage: ChatMessage = {
      role: 'user',
      content: text.trim() || '🌱 Plant / Crop Image Analysis',
      timestamp: new Date().toISOString(),
      image: photoToSend?.dataUrl,
      imageMimeType: photoToSend?.mimeType,
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);
    setAttachedPhoto(null);

    try {
      const result = await api.sendMessage({
        message: text.trim(),
        image: photoToSend?.base64,
        imageMimeType: photoToSend?.mimeType,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        language: selectedLanguage,
        country,
        region,
        conversationId: activeConversationId || undefined,
        token,
      });

      if (result.success) {
        setMessages((prev) => [...prev, result.message]);
        if (!activeConversationId && result.conversationId) {
          setActiveConversationId(result.conversationId);
          loadConversations();
        }

        // Automatic Voice Response: When user asks by voice, speak the advice aloud!
        if (isVoice || lastInputWasVoiceRef.current) {
          speechSynthesis.speak(
            result.message.content,
            selectedLanguage.speechCode || 'en-US',
            result.message.id || `msg-${Date.now()}`
          );
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to receive response from GreenGrow AI.');
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = async () => {
    if (messages.length === 0 || isLoading) return;

    // Find last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const lastUserPrompt = messages[lastUserIndex].content;
    const historyBeforePrompt = messages.slice(0, lastUserIndex);

    // Remove old assistant message if present
    setMessages(messages.slice(0, lastUserIndex + 1));
    setIsLoading(true);
    setError(null);

    try {
      const result = await api.sendMessage({
        message: lastUserPrompt,
        history: historyBeforePrompt.map((m) => ({ role: m.role, content: m.content })),
        language: selectedLanguage,
        country,
        region,
        conversationId: activeConversationId || undefined,
        token,
      });

      if (result.success) {
        setMessages((prev) => [...prev, result.message]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate answer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatLayout
      conversations={conversations}
      activeConversationId={activeConversationId}
      onSelectConversation={handleSelectConversation}
      onNewChat={handleNewChat}
      onDeleteConversation={handleDeleteConversation}
      onOpenGuideModal={() => setIsGuideModalOpen(true)}
    >
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Main Content: FarmerHomeScreen if empty, or ChatWindow if active conversation */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {messages.length === 0 ? (
            <FarmerHomeScreen
              isListening={isListening}
              isSpeechSupported={isSpeechSupported}
              onStartListening={() => {
                setInputText('');
                resetTranscript();
                startListening();
              }}
              onStopListening={stopListening}
              onSelectPrompt={handleSendMessage}
              onOpenLanguageModal={() => setIsLangModalOpen(true)}
              onOpenPhotoModal={() => setIsCameraModalOpen(true)}
              onOpenGuideModal={() => setIsGuideModalOpen(true)}
            />
          ) : (
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              error={error}
              onRetry={handleRegenerate}
              onRegenerate={handleRegenerate}
              speechSynthesis={speechSynthesis}
            />
          )}
        </div>

        {/* Input Bar Pinned at Bottom */}
        <div className="p-3 md:p-4 bg-white/80 backdrop-blur-md border-t border-slate-200/80 max-w-4xl w-full mx-auto">
          <ChatInput
            value={inputText}
            onChange={setInputText}
            attachedPhoto={attachedPhoto}
            onRemovePhoto={() => setAttachedPhoto(null)}
            onOpenPhotoModal={() => setIsCameraModalOpen(true)}
            onSendMessage={(text, photo) => {
              setInputText('');
              resetTranscript();
              handleSendMessage(text, false, photo);
            }}
            isLoading={isLoading}
            isListening={isListening}
            isSpeechSupported={isSpeechSupported}
            onStartListening={() => {
              setInputText('');
              resetTranscript();
              startListening();
            }}
            onStopListening={stopListening}
            onOpenLanguageModal={() => setIsLangModalOpen(true)}
          />
        </div>
      </div>

      {/* Camera / Photo Capture Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={(processed) => {
          setAttachedPhoto(processed);
          setIsCameraModalOpen(false);
        }}
      />

      {/* Floating Speech Audio Player with Real-Time Speed Selector */}
      <SpeechPlayerBar
        isSpeaking={speechSynthesis.isSpeaking}
        isPaused={speechSynthesis.isPaused}
        speechRate={speechSynthesis.speechRate}
        onSetSpeed={speechSynthesis.setSpeechRate}
        onPause={speechSynthesis.pause}
        onResume={speechSynthesis.resume}
        onStop={speechSynthesis.stop}
      />

      {/* Floating Speech Recognition Preview Status */}
      <SpeechRecognitionStatus
        isListening={isListening}
        isTranscribing={isTranscribing}
        transcript={transcript}
        interimTranscript={interimTranscript}
        languageName={selectedLanguage.name}
        onSend={(spokenText) => {
          stopListening();
          resetTranscript();
          setInputText('');
          handleSendMessage(spokenText, true);
        }}
        onEdit={(spokenText) => {
          stopListening();
          if (spokenText) setInputText(spokenText);
        }}
        onCancel={() => {
          stopListening();
          resetTranscript();
          setInputText('');
        }}
        onStop={stopListening}
      />

      {/* Speech Notice Banner with Auto-Retry */}
      {speechError && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 max-w-sm z-50 bg-slate-900/90 text-white p-3.5 rounded-2xl shadow-xl text-xs flex items-center justify-between gap-3 border border-slate-700 animate-fade-in backdrop-blur-sm">
          <div className="flex items-center gap-2 flex-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            <span className="leading-tight">{speechError}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                resetTranscript();
                startListening();
              }}
              className="px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-lg font-semibold transition"
            >
              Retry
            </button>
            <button
              onClick={resetTranscript}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* First-Time Farmer Onboarding Modal */}
      <OnboardingModal />

      {/* Full First-Time User Guide & App Overview */}
      <UserGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* Language Selector Modal */}
      <LanguageSelectorModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
      />
    </ChatLayout>
  );
};
