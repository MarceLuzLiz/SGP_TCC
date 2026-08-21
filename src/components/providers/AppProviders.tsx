'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';
import { InactivityGuard } from '@/components/auth/InactivityGuard';
import { NavigationLoadingProvider } from '@/providers/NavigationLoadingProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={60} // Sincroniza sessão com o servidor a cada 60 segundos
      refetchOnWindowFocus={true} // Verifica sessão imediatamente ao focar na janela
    >
      <NavigationLoadingProvider>
        <InactivityGuard />
        {children}
        <Toaster position="top-right" closeButton />
      </NavigationLoadingProvider>
    </SessionProvider>
  );
}

export default AppProviders;
