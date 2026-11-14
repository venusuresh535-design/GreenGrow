import React, { useState, useMemo } from 'react';
import { X, Check, Globe2, Sparkles } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';
import { Language } from '../../types';
import { LanguageSearch } from './LanguageSearch';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { languages, selectedLanguage, setLanguageByCode } = usePreferences();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'popular' | 'regional' | 'international'>('all');
  const [countryFilter, setCountryFilter] = useState('');

  // Extract unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    languages.forEach((l) => {
      if (l.country) set.add(l.country);
    });
    return Array.from(set).sort();
  }, [languages]);

  // Filtered languages
  const filteredLanguages = useMemo(() => {
    return languages.filter((l) => {
      // Tab filter
      if (activeTab === 'popular' && !l.popular) return false;
      if (activeTab === 'regional' && l.type !== 'regional') return false;
      if (activeTab === 'international' && l.type !== 'international') return false;

      // Country filter
      if (countryFilter && l.country !== countryFilter) return false;

      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = l.name.toLowerCase().includes(q);
        const matchNative = l.nativeName.toLowerCase().includes(q);
        const matchRegion = l.region.toLowerCase().includes(q);
        const matchCountry = l.country.toLowerCase().includes(q);
        const matchCode = l.code.toLowerCase().includes(q);
        return matchName || matchNative || matchRegion || matchCountry || matchCode;
      }

      return true;
    });
  }, [languages, activeTab, countryFilter, search]);

  if (!isOpen) return null;

  const handleSelect = (lang: Language) => {
    setLanguageByCode(lang.code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-forest-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-forest-700 text-white rounded-2xl shadow-sm">
              <Globe2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Select Response Language</h2>
              <p className="text-xs md:text-sm text-slate-500">
                GreenGrow will answer your farming questions in this language
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 md:px-6 md:py-3 border-b border-slate-100 bg-slate-50/70 space-y-3">
          <LanguageSearch value={search} onChange={setSearch} />

          {/* Filter tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({languages.length})
              </button>
              <button
                onClick={() => setActiveTab('popular')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
                  activeTab === 'popular'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Popular
              </button>
              <button
                onClick={() => setActiveTab('regional')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'regional'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Indian Regional
              </button>
              <button
                onClick={() => setActiveTab('international')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'international'
                    ? 'bg-white text-forest-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                International
              </button>
            </div>

            {/* Country quick filter */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-forest-500"
            >
              <option value="">Filter by Country</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Language Grid List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {filteredLanguages.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">
              <p className="text-base font-semibold">No languages found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term or clear filters</p>
            </div>
          ) : (
            filteredLanguages.map((lang) => {
              const isSelected = selectedLanguage.code === lang.code;
              return (
                <button
                  key={`${lang.code}-${lang.country}`}
                  type="button"
                  onClick={() => handleSelect(lang)}
                  className={`flex items-start justify-between p-3.5 rounded-2xl text-left border transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-forest-600 bg-forest-50/80 ring-2 ring-forest-500/30'
                      : 'border-slate-200 hover:border-forest-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                        {lang.nativeName}
                      </span>
                      {isSelected && (
                        <span className="p-0.5 bg-forest-600 text-white rounded-full">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-forest-800">{lang.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {lang.region ? `${lang.region}, ` : ''}
                      {lang.country}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        lang.supportStatus === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {lang.supportStatus === 'available' ? 'Available' : 'Limited Voice'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono uppercase">
                      {lang.code}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 md:px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Selected: <strong className="text-forest-800">{selectedLanguage.name}</strong> ({selectedLanguage.nativeName})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-forest-700 text-white rounded-xl text-xs font-semibold hover:bg-forest-800 transition"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
