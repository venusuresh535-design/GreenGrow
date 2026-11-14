import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import { Language } from '../types';

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface UseSpeechRecognitionOptions {
  lang?: string; // BCP 47 language tag e.g. 'en-US', 'kn-IN', 'hi-IN'
  language?: Language;
  token?: string | null;
  onResult?: (transcript: string) => void;
  onInterim?: (interim: string) => void;
  onError?: (error: string) => void;
}

// Helper: Convert Blob to Base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}) {
  const { lang = 'en-US', language, token, onResult, onInterim, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Check browser support: Any browser with getUserMedia & MediaRecorder or SpeechRecognition
  const isSupported =
    typeof window !== 'undefined' &&
    ((typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function') ||
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const isExplicitlyStoppedRef = useRef<boolean>(false);
  const latestTranscriptRef = useRef<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isExplicitlyStoppedRef.current = true;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
        recognitionRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
        mediaRecorderRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  // Stop recording and process
  const stopListening = useCallback(() => {
    isExplicitlyStoppedRef.current = true;
    setIsListening(false);

    // Stop Web Speech recognition if running
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    // Stop MediaRecorder if running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
    } else {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, []);

  const startListening = useCallback(
    async (resetAll: boolean = true) => {
      if (!isSupported) {
        setError('Voice input is not supported in this browser. Please use Chrome, Edge, or Brave.');
        return;
      }

      isExplicitlyStoppedRef.current = false;
      latestTranscriptRef.current = '';
      audioChunksRef.current = [];

      if (resetAll) {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
      }

      // Step 1: Open microphone stream directly
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
      } catch (micErr: any) {
        console.warn('Microphone access error:', micErr);
        if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError' || micErr.name === 'SecurityError') {
          setError('Microphone permission blocked. Please allow microphone access in your browser address bar.');
        } else if (micErr.name === 'NotFoundError' || micErr.name === 'DevicesNotFoundError') {
          setError('No microphone found on your device. Please connect a headset or microphone.');
        } else {
          setError('Could not access microphone. Please check your audio settings.');
        }
        setIsListening(false);
        if (onError) onError('Microphone access blocked.');
        return;
      }

      setIsListening(true);
      setError(null);

      // Step 2: Start MediaRecorder immediately
      let recorderMimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          recorderMimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          recorderMimeType = 'audio/mp4';
        }

        try {
          const recorder = new MediaRecorder(stream, { mimeType: recorderMimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          recorder.onstop = async () => {
            // Stop media stream tracks
            if (mediaStreamRef.current) {
              mediaStreamRef.current.getTracks().forEach((track) => track.stop());
              mediaStreamRef.current = null;
            }

            const recordedBlob = new Blob(audioChunksRef.current, { type: recorderMimeType });

            // If audio has real content (at least ~400 bytes)
            if (recordedBlob.size > 400) {
              try {
                setIsTranscribing(true);
                const base64Audio = await blobToBase64(recordedBlob);
                const cleanMime = recorderMimeType.split(';')[0];

                const transcribedText = await api.transcribeAudio(
                  base64Audio,
                  cleanMime,
                  language,
                  token
                );

                if (transcribedText && transcribedText.trim().length > 0) {
                  latestTranscriptRef.current = transcribedText.trim();
                  setTranscript(transcribedText.trim());
                  if (onResult) onResult(transcribedText.trim());
                } else if (!latestTranscriptRef.current) {
                  setError('No clear speech was heard. Please tap the microphone and speak again.');
                }
              } catch (transcribeErr: any) {
                console.warn('Audio transcription error:', transcribeErr);
                if (!latestTranscriptRef.current) {
                  setError('Audio transcription failed. Please try speaking clearly or typing your question.');
                }
              } finally {
                setIsTranscribing(false);
              }
            } else {
              setIsTranscribing(false);
            }
          };

          recorder.start(250); // Slice chunks every 250ms
        } catch (recErr: any) {
          console.warn('MediaRecorder init error:', recErr);
        }
      }

      // Step 3: Run SpeechRecognition in parallel if available for live visual preview
      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        try {
          const recognition = new SpeechRecognitionConstructor();
          recognitionRef.current = recognition;

          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.lang = lang;

          recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let currentInterim = '';

            for (let i = 0; i < event.results.length; i++) {
              const item = event.results[i];
              if (item.isFinal) {
                finalTranscript += item[0].transcript;
              } else {
                currentInterim += item[0].transcript;
              }
            }

            const cleanedFinal = finalTranscript.trim();
            if (cleanedFinal) {
              latestTranscriptRef.current = cleanedFinal;
              setTranscript(cleanedFinal);
              if (onResult) onResult(cleanedFinal);
            }

            setInterimTranscript(currentInterim);
            if (onInterim) onInterim(currentInterim);
          };

          recognition.onerror = (event: any) => {
            // Silently ignore network errors from Google Speech WebSocket:
            // MediaRecorder is capturing the actual audio for Gemini!
            if (event.error === 'network' || event.error === 'no-speech' || event.error === 'aborted') {
              return;
            }
            console.warn('WebSpeech API notice:', event.error);
          };

          recognition.onend = () => {
            setInterimTranscript('');
          };

          recognition.start();
        } catch (webSpeechErr: any) {
          console.warn('WebSpeech start notice (MediaRecorder is active):', webSpeechErr);
        }
      }
    },
    [isSupported, lang, language, token, onResult, onInterim, onError]
  );

  const resetTranscript = useCallback(() => {
    latestTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    audioChunksRef.current = [];
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
  };
}
