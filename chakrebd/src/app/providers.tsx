'use client';

import React from 'react';
import { LanguageProvider } from '@/src/components/LanguageContext';
import { ThemeProvider } from '@/src/components/ThemeContext';
import { AuthProvider, useAuth } from '@/src/components/AuthContext';
import { LocationProvider } from '@/lib/locationContext';
import { AppToaster } from '@/src/components/AppToaster';

function LocationBridge({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <LocationProvider userCountryCode={user?.countryCode}>{children}</LocationProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppToaster />
      <AuthProvider>
        <LanguageProvider>
          <LocationBridge>{children}</LocationBridge>
        </LanguageProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
