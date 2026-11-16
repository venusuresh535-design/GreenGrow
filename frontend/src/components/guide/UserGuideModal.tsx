import React, { useState } from 'react';
import {
  X,
  Sprout,
  Mic,
  Camera,
  Volume2,
  MapPin,
  Menu,
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
} from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartInteractiveTour?: () => void;
}

const GUIDE_SECTIONS = [
  {
    id: 'overview',
    title: 'Welcome & Overview',
    icon: Sprout,
    badge: 'Overview',
    badgeColor: 'bg-emerald-100 text-emerald-800',
    headline: 'Your 24/7 AI-Powered Agriculture Assistant',
    description:
      'GreenGrow is a free global farming companion designed to help farmers, growers, and gardeners solve real field challenges using Google Gemini AI.',
    bullets: [
      {
        title: '🌱 Practical Farming Advice',
        text: 'Covers sowing seasons, soil health, irrigation schedules, fertilizer dosages, pest management, and harvest tips.',
      },
      {
        title: '🌐 100% In Your Language',
        text: 'Supports major Indian and international languages including Kannada, Hindi, Russian, Spanish, Tamil, Telugu, and English.',
      },
      {
        title: '⚡ Voice & Vision First',
        text: 'Built for the field—simply speak your question or snap a photo of any damaged plant.',
      },
    ],
  },
  {
    id: 'voice',
    title: 'Voice Assistant',
    icon: Mic,
    badge: 'Voice Input',
    badgeColor: 'bg-forest-100 text-forest-800',
    headline: 'Ask Questions by Speaking Naturally',
    description:
      'No typing required. Simply speak into your phone or computer microphone in your native language.',
    bullets: [
      {
        title: '🎙️ Dual-Engine Voice Recognition',
        text: 'Works seamlessly using advanced browser speech recognition backed by Gemini AI transcription.',
      },
      {
        title: '📝 Live Streaming Words',
        text: 'As you speak, your words appear live in the text box so you can review before sending.',
      },
      {
        title: '🗣️ Automatic Voice Answers',
        text: 'When you ask a question using your voice, GreenGrow automatically speaks the advice aloud to you!',
      },
    ],
  },
  {
    id: 'camera',
    title: 'Crop Doctor (Camera)',
    icon: Camera,
    badge: 'AI Vision',
    badgeColor: 'bg-teal-100 text-teal-800',
    headline: 'Diagnose Plant Diseases & Pests by Photo',
    description:
      "Don't know the name of a disease or pest? Just snap a photo of the sick leaf, fruit, or stem.",
    bullets: [
      {
        title: '📸 Live Camera or Photo Upload',
        text: 'Use your phone camera with the aiming viewfinder, or upload any saved photo from your gallery.',
      },
      {
        title: '🔍 Instant Identification & Diagnosis',
        text: 'GreenGrow identifies the crop (e.g. Tomato, Corn, Rice), explains the visible symptoms, and names the exact disease or pest.',
      },
      {
        title: '🌿 Organic + Chemical Remedies',
        text: 'Provides eco-friendly home remedies (neem oil, wood ash, compost) followed by safe conventional chemical treatment options.',
      },
    ],
  },
  {
    id: 'speed',
    title: 'Talking Speed Control',
    icon: Volume2,
    badge: 'Voice Speed',
    badgeColor: 'bg-blue-100 text-blue-800',
    headline: 'Listen at Your Own Pace (0.75x to 2x)',
    description:
      'Control how fast or slow the assistant speaks when reading farming advice aloud.',
    bullets: [
      {
        title: '🔊 Real-Time Speed Adjuster',
        text: 'Switch between 0.75x (slow), 1x (normal), 1.25x, 1.5x, and 2x (fast) directly while audio is playing.',
      },
      {
        title: '🎵 Natural Pitch Preservation',
        text: 'The voice remains natural, clear, and human-sounding at any speed without robotic distortion.',
      },
      {
        title: '💾 Saved Default Preference',
        text: 'Set your preferred listening speed in Settings, and GreenGrow will remember it across all conversations.',
      },
    ],
  },
  {
    id: 'location',
    title: 'Location & Climate',
    icon: MapPin,
    badge: 'Personalization',
    badgeColor: 'bg-amber-100 text-amber-800',
    headline: 'Customized to Your Soil & Weather',
    description:
      'Different regions have different monsoons, soil types, and crop seasons.',
    bullets: [
      {
        title: '📍 1-Tap Country & State Selection',
        text: 'Select your Country and State from interactive dropdowns (25+ agricultural nations and all Indian states supported).',
      },
      {
        title: '🌦️ Localized Irrigation & Sowing',
        text: 'Advice considers your local climate, typical rains, and regional agricultural extension practices.',
      },
      {
        title: '⚙️ Change Anytime in Settings',
        text: 'Update your location or soil preference whenever you want from the Settings & Region page.',
      },
    ],
  },
  {
    id: 'navigation',
    title: 'Chat History & Menu',
    icon: Menu,
    badge: 'Navigation',
    badgeColor: 'bg-purple-100 text-purple-800',
    headline: 'Organize Your Farming Conversations',
    description:
      'Keep track of multiple fields, crops, and seasons effortlessly.',
    bullets: [
      {
        title: '☰ Hamburger Menu Toggle',
        text: 'Click the 3 horizontal lines in the top-left corner to slide open or collapse your Chat History and menu.',
      },
      {
        title: '➕ Start New Chat',
        text: 'Begin a new session for a different crop without mixing topics.',
      },
      {
        title: '💾 Automatic Saving',
        text: 'All your consultations and plant photo analyses are saved so you can review them throughout the growing season.',
      },
    ],
  },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onStartInteractiveTour,
}) => {
  const { selectedLanguage } = usePreferences();
  const [activeTab, setActiveTab] = useState(0);

  if (!isOpen) return null;

  const currentSection = GUIDE_SECTIONS[activeTab];
  const IconComponent = currentSection.icon;

  const handleNext = () => {
    if (activeTab < GUIDE_SECTIONS.length - 1) {
      setActiveTab((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeTab > 0) {
      setActiveTab((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('greengrow_guide_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-xs">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                  GreenGrow Quick Guide
                </h3>
                <span className="text-[10px] bg-forest-100 text-forest-800 font-bold px-2 py-0.5 rounded-full">
                  User Tour
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Learn what each section does to get immediate farming solutions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition cursor-pointer"
            title="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Interactive Tour Callout Banner */}
        {onStartInteractiveTour && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-gradient-to-r from-forest-800 via-forest-700 to-emerald-700 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold leading-tight">
                  Want a Live On-Screen Tour?
                </h4>
                <p className="text-[11px] text-emerald-100">
                  GreenGrow will spotlight each button on your screen and guide you step-by-step.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onStartInteractiveTour();
              }}
              className="px-3.5 py-1.5 bg-white text-forest-800 hover:bg-emerald-50 rounded-xl text-xs font-extrabold shadow-xs transition active:scale-95 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
            >
              <span>Start Live Tour</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Pills Bar */}
        <div className="flex items-center gap-1 p-2 bg-slate-100/70 border-b border-slate-200/80 overflow-x-auto no-scrollbar">
          {GUIDE_SECTIONS.map((sec, idx) => {
            const TabIcon = sec.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-forest-700 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-forest-800 hover:bg-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 flex flex-col justify-between">
          <div>
            {/* Section Badge & Headline */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${currentSection.badgeColor}`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {currentSection.badge}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Tip {activeTab + 1} of {GUIDE_SECTIONS.length}
              </span>
            </div>

            <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug mb-2">
              {currentSection.headline}
            </h4>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              {currentSection.description}
            </p>

            {/* Feature Bullets Card Grid */}
            <div className="space-y-3">
              {currentSection.bullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3 hover:bg-forest-50/50 transition"
                >
                  <div className="w-2 h-2 rounded-full bg-forest-600 mt-2 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 leading-tight">
                      {bullet.title}
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                      {bullet.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Helpful Note */}
          <div className="mt-6 p-3 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              Active Response Language: <strong>{selectedLanguage.name} ({selectedLanguage.nativeName})</strong>
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold hidden sm:inline">
              Zero typing required
            </span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {GUIDE_SECTIONS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                  activeTab === idx ? 'w-6 bg-forest-700' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeTab > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            {activeTab < GUIDE_SECTIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {onStartInteractiveTour && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartInteractiveTour();
                    }}
                    className="px-3.5 py-2.5 text-xs sm:text-sm font-bold text-forest-800 bg-forest-100 hover:bg-forest-200 rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-forest-700" />
                    <span className="hidden sm:inline">Take</span> Live Tour
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Got It! Start Farming</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
