'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ao mudar de rota (quando o Next.js conclui o carregamento da nova página)
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      const finishTimer = setTimeout(() => {
        setIsNavigating(false);
        setVisible(false);
        setProgress(0);
      }, 300);
      return () => clearTimeout(finishTimer);
    }
  }, [pathname, searchParams, isNavigating]);

  // Interceptar cliques em links internos para disparar a animação instantaneamente
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      const targetAttr = target.getAttribute('target');
      const isDownload = target.hasAttribute('download');

      // Se for link interno válido que causa navegação
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
        // Se já está exatamente na mesma URL, não re-dispara
        const currentUrl = window.location.pathname + window.location.search;
        if (href === currentUrl) return;

        // Inicia a animação de carregamento e o movimento do gradiente na hora
        if (timerRef.current) clearInterval(timerRef.current);
        setVisible(true);
        setIsNavigating(true);
        setProgress(25);

        // Avanço gradual simulado enquanto o servidor processa
        timerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 88) {
              if (timerRef.current) clearInterval(timerRef.current);
              return 88;
            }
            return prev + Math.random() * 12;
          });
        }, 120);
      }
    };

    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleLinkClick, { capture: true });
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    /* Barra de Progresso com Gradiente em Tons Verdes Discretos no Topo da Tela */
    <div className="fixed top-0 left-0 right-0 z-[100000] h-[2.5px] w-full overflow-hidden bg-black/5 dark:bg-white/5 pointer-events-none">
      <div
        className="relative h-full animate-gradient-move transition-all duration-200 ease-out shadow-[0_0_8px_rgba(16,185,129,0.6),0_0_3px_rgba(20,184,166,0.4)]"
        style={{
          width: `${progress}%`,
          backgroundImage:
            'linear-gradient(90deg, #059669 0%, #10b981 25%, #14b8a6 50%, #34d399 75%, #059669 100%)',
          opacity: progress === 100 ? 0 : 1,
          transition: 'width 200ms ease-out, opacity 250ms ease-out',
        }}
      >
        {/* Feixe Suave na Ponta da Linha */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-emerald-200/50 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
      </div>
    </div>
  );
}

export function NavigationProgressBar() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBarContent />
    </Suspense>
  );
}

export default NavigationProgressBar;
