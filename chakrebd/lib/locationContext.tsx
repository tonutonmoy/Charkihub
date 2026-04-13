'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCountryName } from './countries';

const STORAGE_KEY = 'chakrebd_country';

function detectRegionCode(): string {
  if (typeof window === 'undefined') return 'BD';
  try {
    const lang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
    const loc = new Intl.Locale(lang);
    const r = loc.region;
    if (r && /^[A-Z]{2}$/i.test(r)) return r.toUpperCase();
  } catch {
    /* ignore */
  }
  return 'BD';
}

type LocationContextValue = {
  countryCode: string;
  setCountryCode: (code: string) => void;
  countryName: string;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export function LocationProvider({
  children,
  userCountryCode,
}: {
  children: React.ReactNode;
  /** When logged in, prefer profile country */
  userCountryCode?: string | null;
}) {
  const [countryCode, setCountryCodeState] = useState('BD');

  useEffect(() => {
    if (userCountryCode && /^[A-Z]{2}$/i.test(userCountryCode)) {
      setCountryCodeState(userCountryCode.toUpperCase());
      return;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && /^[A-Z]{2}$/i.test(stored)) {
        setCountryCodeState(stored.toUpperCase());
        return;
      }
    } catch {
      /* ignore */
    }
    setCountryCodeState(detectRegionCode());
  }, [userCountryCode]);

  const setCountryCode = useCallback((code: string) => {
    const c = code.trim().toUpperCase().slice(0, 2);
    if (!/^[A-Z]{2}$/.test(c)) return;
    setCountryCodeState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      /* ignore */
    }
  }, []);

  const countryName = useMemo(() => getCountryName(countryCode), [countryCode]);

  const value = useMemo(
    () => ({ countryCode, setCountryCode, countryName }),
    [countryCode, setCountryCode, countryName]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
