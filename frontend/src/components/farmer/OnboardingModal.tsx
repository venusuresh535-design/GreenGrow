import React, { useState } from 'react';
import { Sprout, Globe, MapPin, Mic, Volume2, ArrowRight, Check, Edit2, Camera } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';
import { COUNTRIES_DATA } from '../../data/locations';
import { Button } from '../common/Button';

export const OnboardingModal: React.FC = () => {
  const {
    languages,
    selectedLanguage,
    setLanguageByCode,
    country,
    setCountry,
    region,
    setRegion,
    hasCompletedOnboarding,
    completeOnboarding,
  } = usePreferences();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [isCustomRegion, setIsCustomRegion] = useState(false);

  // Default to India if not specified
  const effectiveCountry = country || 'India';
  const matchedCountryData = COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase() === effectiveCountry.toLowerCase()
  );
  const availableStates = matchedCountryData?.states || [];

  if (hasCompletedOnboarding) return null;

  // Filter popular languages for quick step-2 cards
  const popularLangs = languages.filter((l) => l.popular).slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-forest-100 flex flex-col justify-between min-h-[460px]">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-forest-100 text-forest-800 rounded-xl">
              <Sprout className="w-5 h-5" />
            </span>
            <span className="font-bold text-forest-900 tracking-wide">GreenGrow</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((s) => (
              <span
                key={s}
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-6 bg-forest-700'
                    : s < step
                    ? 'w-2 bg-forest-300'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* STEP 1: Welcome Screen */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center text-center justify-center py-4">
            <div className="w-20 h-20 bg-forest-50 border-2 border-forest-200 rounded-3xl flex items-center justify-center text-4xl mb-4 shadow-inner">
              🌾
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              Welcome to GreenGrow
            </h2>
            <p className="text-forest-700 font-semibold text-base mt-1">
              Smarter Farming. Stronger Communities.
            </p>
            <p className="text-slate-600 text-sm mt-3 max-w-sm leading-relaxed">
              Your free global AI farming assistant. Ask any question about crops, soil, water, fertilizers, and plant diseases by speaking or typing.
            </p>
          </div>
        )}

        {/* STEP 2: Language Selection */}
        {step === 2 && (
          <div className="flex-1 flex flex-col py-2">
            <div className="flex items-center gap-2 mb-2 text-forest-800">
              <Globe className="w-5 h-5 text-forest-700" />
              <h3 className="text-lg font-bold text-slate-900">Choose Your Language</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select the language you want to speak, type, and listen in:
            </p>

            <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
              {popularLangs.map((lang) => {
                const isSelected = selectedLanguage.code === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguageByCode(lang.code)}
                    className={`flex items-center justify-between p-3 rounded-2xl border text-left transition active:scale-95 ${
                      isSelected
                        ? 'border-forest-600 bg-forest-50 ring-2 ring-forest-500/20'
                        : 'border-slate-200 hover:border-forest-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 text-base">{lang.nativeName}</p>
                      <p className="text-xs text-slate-500">{lang.name}</p>
                    </div>
                    {isSelected && (
                      <span className="p-1 bg-forest-700 text-white rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Optional Location Context */}
        {step === 3 && (
          <div className="flex-1 flex flex-col py-2">
            <div className="flex items-center gap-2 mb-2 text-forest-800">
              <MapPin className="w-5 h-5 text-forest-700" />
              <h3 className="text-lg font-bold text-slate-900">Your Farming Location</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Choose your farming location to tailor soil, crop, and irrigation advice to your local climate.
            </p>

            <div className="space-y-4">
              {/* Country Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Country</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCountry(!isCustomCountry)}
                    className="text-[11px] text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isCustomCountry ? 'Choose from list' : 'Type custom'}
                  </button>
                </div>

                {isCustomCountry ? (
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Type your country name..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-slate-800"
                  />
                ) : (
                  <select
                    value={country || 'India'}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setCountry(selected);
                      // Pre-select first state of chosen country if available
                      const matched = COUNTRIES_DATA.find(
                        (c) => c.name.toLowerCase() === selected.toLowerCase()
                      );
                      if (matched && matched.states.length > 0) {
                        setRegion(matched.states[0]);
                      }
                    }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    {COUNTRIES_DATA.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* State / Province Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    State / Province / District
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomRegion(!isCustomRegion)}
                    className="text-[11px] text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isCustomRegion ? 'Choose from list' : 'Type custom district'}
                  </button>
                </div>

                {!isCustomRegion && availableStates.length > 0 ? (
                  <select
                    value={region || availableStates[0] || ''}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 cursor-pointer"
                  >
                    {availableStates.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="Type your state, district, or province..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 text-slate-800"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: How to Ask (Visual Guide) */}
        {step === 4 && (
          <div className="flex-1 flex flex-col py-2">
            <h3 className="text-lg font-bold text-slate-900 mb-2">How to Use GreenGrow</h3>
            <p className="text-xs text-slate-500 mb-4">
              Designed for simplicity and ease of use in the field:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-forest-50 rounded-2xl border border-forest-100">
                <div className="p-2.5 bg-forest-700 text-white rounded-xl flex-shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">1. Speak or Type</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap the big microphone button to speak your question in {selectedLanguage.name}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="p-2.5 bg-emerald-700 text-white rounded-xl flex-shrink-0">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">2. Listen to Answers</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap the &quot;Listen&quot; button under any response to hear the answer read aloud.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-2xl border border-teal-100">
                <div className="p-2.5 bg-teal-700 text-white rounded-xl flex-shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">3. Snap Crop Photos</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Click a leaf photo to diagnose unknown pests and crop diseases with organic remedies.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <div className="p-2.5 bg-amber-600 text-white rounded-xl flex-shrink-0 text-lg">
                  🌱
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">4. 1-Tap Category Cards</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Tap any picture card (Crops, Soil, Water, Pest) to ask common farming questions instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-4">
          {step > 1 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((prev) => (prev - 1) as any)}
            >
              Back
            </Button>
          ) : (
            <span className="text-xs text-slate-400">Step 1 of 4</span>
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              onClick={() => setStep((prev) => (prev + 1) as any)}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={completeOnboarding}
              icon={<Check className="w-5 h-5" />}
              className="bg-forest-700 hover:bg-forest-800"
            >
              Start Farming Assistant
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
