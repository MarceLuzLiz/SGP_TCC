'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const expiredReason = searchParams.get('expired');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
        setIsLoading(false);
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao tentar fazer login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
      {/* Logo e Cabeçalho - Sem caixas cortadas, logo natural com drop shadow */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex items-center justify-center">
          <div className="h-20 w-20 overflow-hidden rounded-2xl shadow-md border border-slate-100/80 dark:border-slate-800">
            <Image
              src="/logo.png"
              alt="SGP Pavimentos Logo"
              width={80}
              height={80}
              className="h-full w-full object-cover rounded-2xl"
              priority
            />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SGP Pavimentos
        </h1>
        <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          Sistema de Gerenciamento de Pavimentos
        </p>
      </div>

      {/* AVISO DE SESSÃO EXPIRADA OU INATIVIDADE */}
      {expiredReason === 'inactivity' && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
          <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Sessão encerrada por inatividade</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Para sua segurança, informe suas credenciais para continuar.
            </p>
          </div>
        </div>
      )}

      {expiredReason === 'session' && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-xs text-teal-900 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
          <div>
            <p className="font-semibold">Sua sessão expirou</p>
            <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
              Por favor, informe suas credenciais para continuar trabalhando.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de Email */}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Email Corporativo
          </label>
          <input
            type="email"
            id="email"
            placeholder="engenheiro@sgp.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Campo de Senha */}
        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Senha
          </label>
          <input
            type="password"
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-slate-100 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Exibição de Erro */}
        {error && (
          <div className="rounded-xl bg-red-50 p-3 text-center text-xs font-medium text-red-700 border border-red-200 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Botão de Entrar */}
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-teal-700 p-3.5 text-sm font-semibold text-white shadow-md shadow-teal-700/20 transition hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-teal-400 dark:bg-teal-600 dark:hover:bg-teal-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar no Sistema'
          )}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Suspense fallback={<div className="text-slate-500 text-sm">Carregando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}