'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Tempo máximo de inatividade sem nenhuma interação do usuário: 1 hora (60 minutos)
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// Aviso prévio antes de deslogar: 5 minutos antes do encerramento (aos 55 min)
const WARNING_THRESHOLD_MS = 5 * 60 * 1000;
// Intervalo de checagem do timer: a cada 15 segundos
const CHECK_INTERVAL_MS = 15 * 1000;

export function InactivityGuard() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const lastActivityRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  const isProtectedPath =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/dashboard-engenheiro') ||
    pathname?.startsWith('/dashboard-admin');

  // Atualiza o timestamp da última interação do usuário
  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    warnedRef.current = false;
  }, []);

  // Força logout e redireciona para a tela de login
  const handleForceLogout = useCallback(
    async (reason: 'inactivity' | 'expired') => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;

      try {
        await signOut({ redirect: false });
      } catch (err) {
        console.error('Erro no signOut:', err);
      } finally {
        router.replace(`/login?expired=${reason}`);
      }
    },
    [router]
  );

  // 1. Escuta eventos de interação do usuário
  useEffect(() => {
    if (!isProtectedPath || status !== 'authenticated') return;

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Throttle para não sobrecarregar o listener
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleUserActivity = () => {
      if (!throttleTimeout) {
        resetActivityTimer();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1000);
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [isProtectedPath, status, resetActivityTimer]);

  // 2. Checagem periódica de inatividade e validade da sessão
  useEffect(() => {
    if (!isProtectedPath || status !== 'authenticated') return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      // Se atingiu o tempo limite de inatividade
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        toast.error('Sua sessão foi encerrada por inatividade para sua segurança.');
        await handleForceLogout('inactivity');
        return;
      }

      // Aviso prévio de que a sessão vai expirar
      if (
        elapsed >= INACTIVITY_TIMEOUT_MS - WARNING_THRESHOLD_MS &&
        !warnedRef.current
      ) {
        warnedRef.current = true;
        toast.warning(
          'Aviso de Inatividade: Sua sessão será encerrada em 5 minutos. Mova o mouse ou clique para continuar conectado.',
          { duration: 8000 }
        );
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isProtectedPath, status, handleForceLogout]);

  // 3. Checagem imediata quando o usuário volta para a aba do navegador
  useEffect(() => {
    if (!isProtectedPath) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const elapsed = now - lastActivityRef.current;

        // Se ficou muito tempo fora da aba
        if (elapsed >= INACTIVITY_TIMEOUT_MS) {
          await handleForceLogout('inactivity');
          return;
        }

        // Verifica no servidor se a sessão JWT ainda é válida
        try {
          const res = await fetch('/api/auth/session');
          const data = await res.json();
          if (!data || !data.user) {
            await handleForceLogout('session');
          } else {
            resetActivityTimer();
          }
        } catch (err) {
          console.error('Falha ao validar sessão ao reativar aba:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isProtectedPath, handleForceLogout, resetActivityTimer]);

  return null;
}

export default InactivityGuard;
