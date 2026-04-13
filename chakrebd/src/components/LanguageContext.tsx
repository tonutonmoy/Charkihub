'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  translate,
  SUPPORTED_LOCALES,
  isSupportedLocale,
} from '@/lib/locales';
import { useAuth } from './AuthContext';
import { updateProfile } from '@/lib/api';

const STORAGE_KEY = 'chakrebd_locale';

interface LanguageContextType {
  /** BCP-style locale code, e.g. en, bn, hi */
  locale: string;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoggedIn, ready } = useAuth();
  const [locale, setLocaleState] = useState('bn');
  const appliedUserLocale = useRef<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isSupportedLocale(stored)) {
        setLocaleState(stored);
        return;
      }
    } catch {
      /* ignore */
    }
    if (typeof navigator !== 'undefined') {
      const lang = navigator.language?.split('-')[0]?.toLowerCase();
      if (lang && isSupportedLocale(lang)) {
        setLocaleState(lang);
      }
    }
  }, []);

  useEffect(() => {
    if (!ready || !isLoggedIn || !user) {
      appliedUserLocale.current = null;
      return;
    }
    if (!user.locale || !user.id) return;
    const c = user.locale.split('-')[0].toLowerCase();
    if (!isSupportedLocale(c)) return;
    if (appliedUserLocale.current === user.id) return;
    appliedUserLocale.current = user.id;
    setLocaleState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
    try {
      document.documentElement.lang = c;
    } catch {
      /* ignore */
    }
  }, [ready, isLoggedIn, user?.locale]);

  const setLanguage = useCallback(
    (code: string) => {
      const c = code.split('-')[0].toLowerCase();
      if (!isSupportedLocale(c)) return;
      setLocaleState(c);
      try {
        localStorage.setItem(STORAGE_KEY, c);
      } catch {
        /* ignore */
      }
      try {
        document.documentElement.lang = c;
      } catch {
        /* ignore */
      }
      if (isLoggedIn) {
        void updateProfile({ locale: c }).catch(() => {
          /* offline / unauthorized */
        });
      }
    },
    [isLoggedIn]
  );

  const t = useCallback(
    (key: string) => {
      return translate(locale, key);
    },
    [locale]
  );

  const isBangla = locale === 'bn';

  return (
    <LanguageContext.Provider value={{ locale, setLanguage, t }}>
      <div className={isBangla ? 'font-bangla' : 'font-sans'}>{children}</div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

export { SUPPORTED_LOCALES, isSupportedLocale };
