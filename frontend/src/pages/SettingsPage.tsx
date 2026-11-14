import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Globe2,
  MapPin,
  User,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Save,
  LogOut,
  Activity,
  Edit2,
  Volume2,
} from 'lucide-react';
import { usePreferences } from '../context/PreferencesContext';
import { useAuth } from '../context/AuthContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { Button } from '../components/common/Button';
import { COUNTRIES_DATA } from '../data/locations';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const {
    languages,
    selectedLanguage,
    setLanguageByCode,
    country,
    setCountry,
    region,
    setRegion,
    speechRate,
    setSpeechRate,
    resetOnboarding,
  } = usePreferences();

  const { user, isGuest, signOut } = useAuth();
  const speech = useSpeechSynthesis();

  const [tempLang, setTempLang] = useState(selectedLanguage.code);
  const [tempCountry, setTempCountry] = useState(country || 'India');
  const [tempRegion, setTempRegion] = useState(region || 'Karnataka');
  const [tempSpeechRate, setTempSpeechRate] = useState(speechRate || 1.0);
  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [isCustomRegion, setIsCustomRegion] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  // Compute available states for current selected country
  const matchedCountry = COUNTRIES_DATA.find(
    (c) => c.name.toLowerCase() === (tempCountry || '').toLowerCase()
  );
  const availableStates = matchedCountry?.states || [];

  useEffect(() => {
    setTempLang(selectedLanguage.code);
    setTempCountry(country);
    setTempRegion(region);
    setTempSpeechRate(speechRate || 1.0);

    // Fetch system health
    api.checkHealth().then(setHealthStatus).catch(console.warn);
  }, [selectedLanguage, country, region, speechRate]);

  const handleSave = () => {
    setLanguageByCode(tempLang);
    setCountry(tempCountry);
    setRegion(tempRegion);
    setSpeechRate(tempSpeechRate);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-forest-800 hover:text-forest-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Farming Chat
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            GreenGrow Settings
          </span>
        </div>

        {/* Title */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Farming Preferences &amp; Account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your preferred response language and local agricultural context.
          </p>

          {savedSuccess && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Preferences saved successfully! Future AI answers will reflect these settings.</span>
            </div>
          )}

          {/* Form */}
          <div className="mt-6 space-y-6">
            {/* Preferred Language */}
            <div>
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-1.5">
                <Globe2 className="w-4 h-4 text-forest-700" />
                Response Language
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Gemini will respond in this language. You can type or speak in this language.
              </p>
              <select
                value={tempLang}
                onChange={(e) => setTempLang(e.target.value)}
                className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} – {l.name} ({l.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Geographical Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Country Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    Country
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCountry(!isCustomCountry)}
                    className="text-xs text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isCustomCountry ? 'Choose list' : 'Type manual'}
                  </button>
                </div>

                {isCustomCountry ? (
                  <input
                    type="text"
                    value={tempCountry}
                    onChange={(e) => setTempCountry(e.target.value)}
                    placeholder="e.g. India, Kenya..."
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition"
                  />
                ) : (
                  <select
                    value={tempCountry || 'India'}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setTempCountry(selected);
                      const matched = COUNTRIES_DATA.find(
                        (c) => c.name.toLowerCase() === selected.toLowerCase()
                      );
                      if (matched && matched.states.length > 0) {
                        setTempRegion(matched.states[0]);
                      }
                    }}
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition cursor-pointer"
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
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-forest-700" />
                    State / Province / Region
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomRegion(!isCustomRegion)}
                    className="text-xs text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    {isCustomRegion ? 'Choose list' : 'Type manual'}
                  </button>
                </div>

                {!isCustomRegion && availableStates.length > 0 ? (
                  <select
                    value={tempRegion || availableStates[0] || ''}
                    onChange={(e) => setTempRegion(e.target.value)}
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition cursor-pointer"
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
                    value={tempRegion}
                    onChange={(e) => setTempRegion(e.target.value)}
                    placeholder="e.g. Karnataka, California, Punjab..."
                    className="w-full py-3 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-white transition"
                  />
                )}
              </div>
            </div>

            {/* AI Assistant Talking Speed */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-forest-700" />
                  AI Assistant Talking Speed
                </label>
                <button
                  type="button"
                  onClick={() => {
                    speech.stop();
                    speech.setSpeechRate(tempSpeechRate);
                    const sampleText =
                      tempLang === 'kn'
                        ? 'ನಮಸ್ಕಾರ, ನಾನು ಗ್ರೀನ್‌ಗ್ರೋ ಕೃಷಿ ಸಹಾಯಕ.'
                        : tempLang === 'hi'
                          ? 'नमस्ते, मैं ग्रीनग्रो कृषि सहायक हूँ।'
                          : tempLang === 'ru'
                            ? 'Здравствуйте, я сельскохозяйственный помощник GreenGrow.'
                            : 'Hello, I am GreenGrow, your agriculture assistant.';
                    speech.speak(sampleText, tempLang, 'preview');
                  }}
                  className="text-xs text-forest-700 hover:text-forest-900 font-semibold underline flex items-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Preview Speed ({tempSpeechRate}x)
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">
                Adjust how fast or slow GreenGrow speaks when reading agricultural advice aloud.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { value: 0.75, label: '0.75x', desc: 'Slow' },
                  { value: 1.0, label: '1x', desc: 'Normal' },
                  { value: 1.25, label: '1.25x', desc: 'Comfort' },
                  { value: 1.5, label: '1.5x', desc: 'Brisk' },
                  { value: 2.0, label: '2x', desc: 'Fast' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTempSpeechRate(opt.value);
                      speech.setSpeechRate(opt.value);
                    }}
                    className={`py-2 px-1 rounded-xl text-center border transition active:scale-95 cursor-pointer ${
                      Math.abs(tempSpeechRate - opt.value) < 0.05
                        ? 'bg-forest-700 text-white border-forest-700 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="block font-extrabold text-sm">{opt.label}</span>
                    <span
                      className={`block text-[10px] ${
                        Math.abs(tempSpeechRate - opt.value) < 0.05
                          ? 'text-forest-200 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleSave}
              icon={<Save className="w-4 h-4" />}
              className="bg-forest-700 hover:bg-forest-800"
            >
              Save Preferences
            </Button>
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-forest-700" />
            Account Status
          </h2>
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">
                {user ? user.email : isGuest ? 'Guest Farmer Session' : 'Offline Farmer'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {user
                  ? 'Authenticated via Supabase. Conversations synced to cloud.'
                  : 'Operating in guest mode. Conversations stored locally.'}
              </p>
            </div>
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                icon={<LogOut className="w-3.5 h-3.5" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Log Out
              </Button>
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm">
                  Log In
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* System & AI Status */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-forest-700" />
            System Health &amp; Services
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500 block">AI Integration</span>
              <span className="font-bold text-slate-800 block text-sm mt-0.5">
                Google Gemini API
              </span>
              <span className="text-forest-700 font-semibold mt-1 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {healthStatus?.ai?.configured ? 'Active & Ready' : 'Backend Connected'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500 block">Database Storage</span>
              <span className="font-bold text-slate-800 block text-sm mt-0.5">
                Supabase PostgreSQL
              </span>
              <span className="text-forest-700 font-semibold mt-1 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                {healthStatus?.database?.configured ? 'Cloud Connected' : 'Local / Demo Mode Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Re-trigger Intro Walkthrough */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">First-Time User Walkthrough</h3>
            <p className="text-xs text-slate-500">Show the step-by-step introduction again</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resetOnboarding();
              alert('Onboarding reset! Return to the chat page to see the welcome intro.');
            }}
            icon={<HelpCircle className="w-3.5 h-3.5" />}
          >
            Reset Guide
          </Button>
        </div>
      </div>
    </div>
  );
};
