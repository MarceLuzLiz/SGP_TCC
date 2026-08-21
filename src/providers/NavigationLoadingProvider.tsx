'use client';

import React, { createContext, useContext, useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface NavigationLoadingContextType {
  isNavigating: boolean;
  navigatingHref: string | null;
  startNavigation: (href?: string) => void;
  stopNavigation: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isNavigating: false,
  navigatingHref: null,
  startNavigation: () => {},
  stopNavigation: () => {},
});

export const useNavigationLoading = () => useContext(NavigationLoadingContext);

function NavigationTracker({ onReset }: { onReset: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    onReset();
  }, [pathname, searchParams, onReset]);

  return null;
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startNavigation = useCallback((href?: string) => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setIsNavigating(true);
    setVisible(true);
    setProgress(28);
    if (href) setNavigatingHref(href);

    // Avanço gradual simulado com movimento contínuo
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          return 85;
        }
        return prev + Math.random() * 12;
      });
    }, 120);
  }, []);

  const stopNavigation = useCallback(() => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    
    // Completa a barra suavemente até 100% e depois desvanece
    setProgress(100);
    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setIsNavigating(false);
      setNavigatingHref(null);
      setProgress(0);
    }, 450);
  }, []);

  // Intercepta cliques em qualquer link interno para ativar automaticamente a barra laser
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const isDownload = target.hasAttribute('download');

      if (
        href &&
        href.startsWith('/') &&
        !href.startsWith('/#') &&
        !href.startsWith('//') &&
        targetAttr !== '_blank' &&
        !isDownload &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        startNavigation(href);
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [startNavigation]);

  return (
    <NavigationLoadingContext.Provider value={{ isNavigating, navigatingHref, startNavigation, stopNavigation }}>
      <Suspense fallback={null}>
        <NavigationTracker onReset={stopNavigation} />
      </Suspense>

      {/* Top Glowing Laser Gradient Bar (Visível e Fluida em Todas as Transições) */}
      {visible && (
        <div className="fixed top-0 left-0 right-0 z-[100000] h-[3.5px] w-full overflow-hidden bg-black/10 dark:bg-white/10 pointer-events-none">
          <div
            className="relative h-full animate-gradient-move shadow-[0_0_14px_rgba(147,51,234,0.8),0_0_8px_rgba(13,148,136,0.8)]"
            style={{
              width: `${progress}%`,
              backgroundImage:
                'linear-gradient(90deg, #0f766e 0%, #7e22ce 25%, #f59e0b 50%, #0d9488 75%, #0f766e 100%)',
              opacity: progress === 100 ? 0.9 : 1,
              transition: 'width 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 350ms ease-out',
            }}
          >
            {/* Feixe de Luz / Laser na Ponta da Linha */}
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-r from-transparent to-white/70 shadow-[0_0_12px_#fff]" />
          </div>
        </div>
      )}

      {/* Floating Container Page Loading Feedback Pill (Roxo Translúcido Oficial) */}
      {visible && (
        <div className="fixed top-4 right-6 z-[99998] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-[#1e1035]/95 border border-purple-500/50 text-white px-4 py-2 rounded-full shadow-2xl shadow-purple-950/60 flex items-center gap-2.5 backdrop-blur-md">
            <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-100">
              Carregando...
            </span>
          </div>
        </div>
      )}

      {children}
    </NavigationLoadingContext.Provider>
  );
}

export default NavigationLoadingProvider;
