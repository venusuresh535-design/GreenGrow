import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Globe2,
  Camera,
  Mic,
  MessageSquare,
  Settings,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  badge: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  actionHint?: string;
  actionButtonLabel?: string;
  onAction?: () => void;
  preferredPlacement?: 'top' | 'bottom';
}

interface InteractiveTourProps {
  isActive: boolean;
  onClose: () => void;
  onOpenLanguageModal?: () => void;
  onOpenPhotoModal?: () => void;
  onOpenSidebar?: () => void;
  onCloseSidebar?: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  isActive,
  onClose,
  onOpenLanguageModal,
  onOpenPhotoModal,
  onOpenSidebar,
  onCloseSidebar,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'bottom',
  });

  const steps: TourStep[] = [
    {
      id: 'sidebar-toggle',
      selector: '#tour-sidebar-toggle',
      title: 'Chat History & Menu',
      badge: 'Step 1: Navigation',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: Menu,
      description:
        'Tap the 3 horizontal lines here to slide open your Chat History drawer. You can view all past crop consultations, delete old queries, or start fresh for a different field.',
      actionButtonLabel: 'Slide Open History',
      onAction: () => {
        if (onOpenSidebar) onOpenSidebar();
      },
    },
    {
      id: 'language-selector',
      selector: '#tour-language-selector',
      title: 'Regional Language Selector',
      badge: 'Step 2: Multilingual AI',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: Globe2,
      description:
        'Tap this pill to switch languages. GreenGrow speaks and answers in 15+ Indian and world languages (Kannada, Hindi, Tamil, Telugu, Russian, Spanish, English). All advice is generated in this chosen language.',
      actionButtonLabel: 'Open Language Selector',
      onAction: () => {
        if (onOpenLanguageModal) onOpenLanguageModal();
      },
    },
    {
      id: 'camera-button',
      selector: '#tour-camera-button',
      title: 'Crop Doctor (AI Vision)',
      badge: 'Step 3: Crop Doctor',
      badgeColor: 'bg-teal-100 text-teal-800',
      icon: Camera,
      description:
        'Have a diseased leaf, damaged fruit, or unknown pest? Tap this camera button to snap or upload a crop photo for instant AI diagnosis and organic + chemical treatment plans.',
      actionButtonLabel: 'Try Crop Camera',
      onAction: () => {
        if (onOpenPhotoModal) onOpenPhotoModal();
      },
      preferredPlacement: 'top',
    },
    {
      id: 'mic-button',
      selector: '#tour-mic-button',
      title: 'Hands-Free Voice Assistant',
      badge: 'Step 4: Voice First',
      badgeColor: 'bg-forest-100 text-forest-800',
      icon: Mic,
      description:
        'Designed for the field! Tap this microphone and speak your farming questions naturally in your mother tongue without typing. GreenGrow listens and reads its answers aloud to you.',
      preferredPlacement: 'top',
    },
    {
      id: 'input-box',
      selector: '#tour-input-box',
      title: 'Farming Question Input',
      badge: 'Step 5: Ask Any Question',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: MessageSquare,
      description:
        'Type or review your question here. Ask about fertilizer dosages (NPK), drip irrigation, soil preparation, pest outbreaks, or planting calendars for your crop.',
      preferredPlacement: 'top',
    },
    {
      id: 'settings-link',
      selector: '#tour-settings-link',
      title: 'Settings, Climate & Speech Speed',
      badge: 'Step 6: Personalization',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: Settings,
      description:
        'Configure your Country, State/Region, and audio speaking speed (0.75x to 2x) so agricultural advice matches your local soil and climate.',
      preferredPlacement: 'bottom',
    },
    {
      id: 'guide-button',
      selector: '#tour-guide-button',
      title: 'Quick Guide & App Tour',
      badge: 'Step 7: Help Center',
      badgeColor: 'bg-rose-100 text-rose-800',
      icon: HelpCircle,
      description:
        'Tap this Guide button anytime you need to restart this interactive tour or view the full farming manual and tips.',
      preferredPlacement: 'bottom',
    },
  ];

  const currentStep = steps[currentStepIndex];

  // Update target measurements
  const updatePosition = useCallback(() => {
    if (!isActive || !currentStep) return;

    const el = document.querySelector(currentStep.selector) as HTMLElement | null;
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Scroll into view if off-screen
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Calculate smart tooltip coordinates
    const tooltipWidth = Math.min(380, window.innerWidth - 32);
    const tooltipHeight = 220; // approximate
    const margin = 14;

    let placement: 'top' | 'bottom' = currentStep.preferredPlacement || 'bottom';

    // If preferred is bottom but near bottom edge, flip to top
    if (rect.bottom + tooltipHeight + margin > window.innerHeight && rect.top > tooltipHeight) {
      placement = 'top';
    } else if (rect.top - tooltipHeight - margin < 0) {
      placement = 'bottom';
    }

    let top = placement === 'top' ? rect.top - tooltipHeight - margin : rect.bottom + margin;
    // Clamp top to viewport
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));

    // Center horizontally around target, clamped to screen
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    setTooltipPos({ top, left, placement });
  }, [isActive, currentStep]);

  useEffect(() => {
    if (isActive) {
      updatePosition();
      const timer = setTimeout(updatePosition, 100);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [isActive, currentStepIndex, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStepIndex]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('greengrow_tour_completed', 'true');
    localStorage.setItem('greengrow_guide_seen', 'true');
    if (onCloseSidebar) onCloseSidebar();
    onClose();
  };

  if (!isActive) return null;

  const StepIcon = currentStep?.icon || Sparkles;
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-auto select-none animate-fade-in">
      {/* SVG Spotlight Mask Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none transition-all duration-300"
        style={{ zIndex: 999 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx={16}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.72)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Pulsing Highlight Frame */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-2xl border-2 border-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.4)] transition-all duration-300 animate-pulse"
          style={{
            zIndex: 1000,
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}

      {/* Floating Guided Tooltip Card */}
      <div
        className="fixed z-[1001] transition-all duration-300 w-[calc(100vw-32px)] sm:w-[380px]"
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
        }}
      >
        <div className="bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/90 text-slate-800 flex flex-col gap-3.5 backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${currentStep.badgeColor}`}
            >
              <StepIcon className="w-3.5 h-3.5" />
              {currentStep.badge}
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {currentStepIndex + 1} of {steps.length}
              </span>
              <button
                type="button"
                onClick={handleComplete}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                title="Exit tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-forest-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Body */}
          <div>
            <h4 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug flex items-center gap-2">
              {currentStep.title}
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Optional Action / Interactive Try It Button */}
          {currentStep.actionButtonLabel && currentStep.onAction && (
            <button
              type="button"
              onClick={currentStep.onAction}
              className="w-full py-2 px-3 bg-forest-50 hover:bg-forest-100/90 text-forest-800 border border-forest-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>{currentStep.actionButtonLabel}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                    currentStepIndex === idx ? 'w-4 bg-forest-700' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                  title={`Step ${idx + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </button>
              )}

              {currentStepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Next Section</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleComplete}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Start Farming!</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
