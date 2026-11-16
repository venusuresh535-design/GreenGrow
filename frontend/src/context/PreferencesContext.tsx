import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import languagesData from '../data/languages.json';
import { Language } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';
import { getTranslation, TranslationKey } from '../utils/translations';

interface PreferencesContextType {
  languages: Language[];
  selectedLanguage: Language;
  setLanguageByCode: (code: string) => void;
  country: string;
  setCountry: (country: string) => void;
  region: string;
  setRegion: (region: string) => void;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const languages: Language[] = languagesData as Language[];

  // Default to English
  const defaultLanguage = languages.find((l) => l.code === 'en') || languages[0];

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const savedCode = localStorage.getItem('greengrow_lang');
    if (savedCode) {
      const found = languages.find((l) => l.code === savedCode);
      if (found) return found;
    }
    return defaultLanguage;
  });

  const [country, setCountryState] = useState<string>(() => {
    return localStorage.getItem('greengrow_country') || '';
  });

  const [region, setRegionState] = useState<string>(() => {
    return localStorage.getItem('greengrow_region') || '';
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    const saved = localStorage.getItem('greengrow_speech_rate');
    return saved ? parseFloat(saved) : 1.0;
  });

  const setSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    localStorage.setItem('greengrow_speech_rate', rate.toString());
  };

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('greengrow_onboarded') === 'true';
  });

  // Sync with profile if user is authenticated
  useEffect(() => {
    if (user && token) {
      api.getProfile(token).then((profile) => {
        if (profile.preferred_language) {
          const matched = languages.find((l) => l.code === profile.preferred_language);
          if (matched) {
            setSelectedLanguage(matched);
            localStorage.setItem('greengrow_lang', matched.code);
          }
        }
        if (profile.country_code) {
          setCountryState(profile.country_code);
          localStorage.setItem('greengrow_country', profile.country_code);
        }
        if (profile.region) {
          setRegionState(profile.region);
          localStorage.setItem('greengrow_region', profile.region);
        }
      }).catch((err) => {
        console.warn('Could not load user profile preferences:', err);
      });
    }
  }, [user, token, languages]);

  const setLanguageByCode = (code: string) => {
    const found = languages.find((l) => l.code.toLowerCase() === code.toLowerCase());
    if (found) {
      setSelectedLanguage(found);
      localStorage.setItem('greengrow_lang', found.code);

      // If logged in, update remote profile asynchronously
      if (user && token) {
        api.updateProfile({ preferred_language: found.code }, token).catch(console.warn);
      }
    }
  };

  const setCountry = (newCountry: string) => {
    setCountryState(newCountry);
    localStorage.setItem('greengrow_country', newCountry);
    if (user && token) {
      api.updateProfile({ country_code: newCountry }, token).catch(console.warn);
    }
  };

  const setRegion = (newRegion: string) => {
    setRegionState(newRegion);
    localStorage.setItem('greengrow_region', newRegion);
    if (user && token) {
      api.updateProfile({ region: newRegion }, token).catch(console.warn);
    }
  };

  const completeOnboarding = () => {
    setHasCompletedOnboarding(true);
    localStorage.setItem('greengrow_onboarded', 'true');
  };

  const resetOnboarding = () => {
    setHasCompletedOnboarding(false);
    localStorage.removeItem('greengrow_onboarded');
  };

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string>): string => {
      return getTranslation(key, selectedLanguage.code, params);
    },
    [selectedLanguage.code]
  );

  return (
    <PreferencesContext.Provider
      value={{
        languages,
        selectedLanguage,
        setLanguageByCode,
        country,
        setCountry,
        region,
        setRegion,
        hasCompletedOnboarding,
        completeOnboarding,
        resetOnboarding,
        speechRate,
        setSpeechRate,
        t,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
