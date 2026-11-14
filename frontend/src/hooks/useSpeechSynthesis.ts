import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Detect native script from text
export function detectScriptLanguage(text: string): string | null {
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada (ಕನ್ನಡ)
  if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi / Marathi (हिन्दी)
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu (తెలుగు)
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil (தமிழ்)
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'; // Malayalam (മലയാളം)
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali / Assamese (বাংলা)
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'; // Gujarati (ગુજરાતી)
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'; // Punjabi (ਪੰਜਾਬੀ)
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or'; // Odia (ଓଡ଼ಿଆ)
  if (/[\u0600-\u06FF]/.test(text)) return 'ur'; // Urdu / Arabic (اردو)
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese (中文)
  if (/[\u3040-\u30FF]/.test(text)) return 'ja'; // Japanese (日本語)
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean (한국어)
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th'; // Thai (ภาษาไทย)
  if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian (Русский)
  return null;
}

// Clean markdown syntax for speech
export function cleanTextForSpeech(text: string): string {
  return text
    .replace(/[*#_~`>]/g, '') // remove markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove links
    .replace(/\n\s*[-*]\s*/g, '. ') // bullet points to pauses
    .replace(/\n\s*\d+\.\s*/g, '. ') // numbers to pauses
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtteranceId, setCurrentUtteranceId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speechRate, setSpeechRateState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('greengrow_speech_rate');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0.5 && val <= 4.0) return val;
      }
    }
    return 1.0;
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fallbackUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const setSpeechRate = useCallback((rate: number) => {
    setSpeechRateState(rate);
    if (typeof window !== 'undefined') {
      localStorage.setItem('greengrow_speech_rate', rate.toString());
    }
    // Update currently playing audio in real-time immediately!
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  // Load and cache browser voices when available
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setAvailableVoices(v);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentUtteranceId(null);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const speak = useCallback(
    (text: string, speechCode: string = 'en-US', id: string = 'default') => {
      // If already speaking this message, toggle stop
      if (isSpeaking && currentUtteranceId === id) {
        stop();
        return;
      }

      stop();

      const cleaned = cleanTextForSpeech(text);
      if (!cleaned) return;

      // Detect native script or use speech code
      const detectedLang = detectScriptLanguage(cleaned);
      const targetLang = detectedLang || speechCode.split('-')[0].toLowerCase() || 'en';

      setIsSpeaking(true);
      setIsPaused(false);
      setCurrentUtteranceId(id);

      // 1. Primary: Use backend native neural TTS endpoint for authentic pronunciation
      try {
        const ttsUrl = `${API_BASE_URL}/tts?text=${encodeURIComponent(cleaned.substring(0, 1000))}&lang=${encodeURIComponent(targetLang)}`;
        const audio = new Audio(ttsUrl);
        audio.playbackRate = speechRate;
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };

        audio.onended = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setCurrentUtteranceId(null);
          audioRef.current = null;
        };

        audio.onerror = (err) => {
          console.warn('Native audio stream error, falling back to browser Web Speech API:', err);
          // Fallback to browser Web Speech API
          fallbackBrowserSpeech(cleaned, targetLang, id);
        };

        audio.play().catch((playErr) => {
          console.warn('Audio play prevented or failed:', playErr.message);
          fallbackBrowserSpeech(cleaned, targetLang, id);
        });
      } catch (err: any) {
        console.warn('TTS streaming initialization error:', err.message);
        fallbackBrowserSpeech(cleaned, targetLang, id);
      }
    },
    [isSpeaking, currentUtteranceId, speechRate, stop]
  );

  // Fallback to browser SpeechSynthesis
  const fallbackBrowserSpeech = (cleaned: string, targetLang: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSpeaking(false);
      setCurrentUtteranceId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = targetLang;
      utterance.rate = Math.max(0.5, Math.min(2.0, speechRate));

      // Find matching voice if available
      const voiceList = availableVoices.length > 0 ? availableVoices : window.speechSynthesis.getVoices();
      const matched = voiceList.find(
        (v) =>
          v.lang.toLowerCase().startsWith(targetLang.toLowerCase()) ||
          v.lang.toLowerCase().replace('_', '-').startsWith(targetLang.toLowerCase()) ||
          v.name.toLowerCase().includes(targetLang.toLowerCase())
      );
      if (matched) {
        utterance.voice = matched;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setCurrentUtteranceId(id);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentUtteranceId(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setCurrentUtteranceId(null);
      };

      fallbackUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setIsSpeaking(false);
      setCurrentUtteranceId(null);
    }
  };

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    speechRate,
    setSpeechRate,
    isSupported: true, // Both backend streaming and browser speech supported
    currentUtteranceId,
  };
}
