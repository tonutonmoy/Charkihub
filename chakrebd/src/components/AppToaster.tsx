'use client';

import { Toaster } from 'sonner';
import { useTheme } from '@/src/components/ThemeContext';

export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'font-sans border-border bg-card text-card-foreground shadow-lg [&_[data-description]]:text-muted-foreground',
          success: 'border-primary/30 bg-card text-card-foreground [&_.toast-icon]:text-primary',
          error: 'border-destructive/40 bg-card text-card-foreground',
          warning: 'border-secondary/40 bg-card',
          info: 'border-primary/25 bg-card',
        },
      }}
    />
  );
}
