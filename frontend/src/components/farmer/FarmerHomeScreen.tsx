import React from 'react';
import { Sparkles, Globe2, HelpCircle, Camera, BookOpen } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';
import { MicrophoneButton } from '../voice/MicrophoneButton';
import { AgricultureCategoryCards } from './AgricultureCategoryCards';
import { SUGGESTED_PROMPTS } from '../../data/categories';

interface FarmerHomeScreenProps {
  isListening: boolean;
  isSpeechSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onSelectPrompt: (prompt: string) => void;
  onOpenLanguageModal: () => void;
  onOpenPhotoModal?: () => void;
  onOpenGuideModal?: () => void;
  onStartInteractiveTour?: () => void;
}

export const FarmerHomeScreen: React.FC<FarmerHomeScreenProps> = ({
  isListening,
  isSpeechSupported,
  onStartListening,
  onStopListening,
  onSelectPrompt,
  onOpenLanguageModal,
  onOpenPhotoModal,
  onOpenGuideModal,
  onStartInteractiveTour,
}) => {
  const { selectedLanguage, country, region } = usePreferences();

  return (
    <div className="w-full max-w-3xl mx-auto py-4 md:py-8 px-4 flex flex-col items-center">
      {/* Welcome & Tagline */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-forest-100 text-forest-800 rounded-full text-xs font-semibold mb-3 border border-forest-200">
          <span>🌱</span>
          <span>Smarter Farming. Stronger Communities. A Greener World.</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          How can GreenGrow help your farm today?
        </h1>
        <p className="text-sm md:text-base text-slate-600 mt-2 max-w-lg mx-auto">
          Ask any farming question by speaking, typing, or uploading a plant photo. Answers are powered by Google Gemini in your chosen language.
        </p>

        {/* Current Language & Region Pill */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onOpenLanguageModal}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-white border border-forest-300 text-forest-800 rounded-full shadow-xs hover:bg-forest-50 transition"
          >
            <Globe2 className="w-3.5 h-3.5 text-forest-600" />
            <span>Response Language:</span>
            <span className="font-bold underline">{selectedLanguage.name} ({selectedLanguage.nativeName})</span>
          </button>

          {(country || region) && (
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              📍 {[region, country].filter(Boolean).join(', ')}
            </span>
          )}

          {onStartInteractiveTour && (
            <button
              type="button"
              onClick={onStartInteractiveTour}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 bg-forest-700 text-white rounded-full shadow-xs hover:bg-forest-800 transition active:scale-95 cursor-pointer"
              title="Start live interactive on-screen walkthrough"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>🎯 Live App Tour</span>
            </button>
          )}

          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 bg-white border border-forest-300 text-forest-800 rounded-full shadow-xs hover:bg-forest-50 transition cursor-pointer"
              title="First-time farmer guide and app tour"
            >
              <BookOpen className="w-3.5 h-3.5 text-forest-600" />
              <span>📖 Guide Cards</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Banners: Voice and Camera side-by-side */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Voice Card */}
        <div className="bg-gradient-to-br from-forest-800 via-forest-900 to-emerald-950 text-white rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-forest-600/20 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-forest-700/60 text-forest-200 rounded-full text-[10px] font-semibold mb-2">
              <span>🎙️</span> Voice Assistant
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-1">
              Tap Microphone &amp; Speak
            </h2>
            <p className="text-xs text-forest-200 mb-4 max-w-xs mx-auto">
              Speak in <strong className="text-white">{selectedLanguage.name}</strong> to ask crop or soil questions.
            </p>
          </div>

          <div className="my-2">
            <MicrophoneButton
              isListening={isListening}
              isSupported={isSpeechSupported}
              onStart={onStartListening}
              onStop={onStopListening}
              size="md"
              className="border-4 border-white/30"
            />
          </div>

          <p className="text-xs text-forest-300 font-medium">
            {isListening ? 'Listening now... Click to stop' : 'Click to start speaking'}
          </p>
        </div>

        {/* Camera Diagnosis Card */}
        <div className="bg-gradient-to-br from-teal-800 via-emerald-900 to-forest-950 text-white rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden justify-between">
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-700/60 text-teal-200 rounded-full text-[10px] font-semibold mb-2">
              <span>📷</span> AI Vision Diagnosis
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-1">
              Snap Crop / Plant Photo
            </h2>
            <p className="text-xs text-teal-200 mb-4 max-w-xs mx-auto">
              Don't know the pest or disease? Take a photo of the sick leaf or crop for instant AI diagnosis.
            </p>
          </div>

          <div className="my-2">
            <button
              type="button"
              onClick={onOpenPhotoModal}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 transition flex items-center justify-center shadow-lg border-4 border-white/30 text-white cursor-pointer group"
              title="Click photo of plant or upload from device"
            >
              <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          <p className="text-xs text-teal-200 font-medium">
            Tap camera to snap or upload leaf photo
          </p>
        </div>
      </div>

      {/* 6 Picture-based Categories */}
      <div className="w-full mb-8">
        <AgricultureCategoryCards onSelectQuestion={onSelectPrompt} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="w-full">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5 px-1">
          <HelpCircle className="w-4 h-4 text-forest-600" />
          Common Farming Questions
        </h3>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="text-xs md:text-sm text-slate-700 bg-white hover:bg-forest-50 hover:text-forest-800 border border-slate-200 hover:border-forest-300 rounded-xl px-3.5 py-2 transition shadow-2xs text-left active:scale-95 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-forest-600 flex-shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
