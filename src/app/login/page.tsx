// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react'; // Importamos o ícone de loading

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Novo estado para controlar o carregamento
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // 1. Ativa o loading ao clicar

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
        setIsLoading(false); // 2. Desativa o loading se der erro para tentar de novo
        return;
      }

      // 3. Se deu certo, NÃO desativamos o loading.
      // Deixamos o spinner rodando enquanto o router.push carrega a nova página.
      // Isso dá uma sensação de continuidade muito melhor.
      router.push('/dashboard');

    } catch (error) {
      console.error(error);
      setError('Ocorreu um erro ao tentar fazer login.');
      setIsLoading(false); // Desativa em caso de erro crítico
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-800">
          SGP - Acesso ao Sistema
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Sistema de Gerenciamento de Pavimentos
        </p>

        <form onSubmit={handleSubmit}>
          {/* Campo de Email */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading} // Bloqueia input durante loading
              className="w-full rounded-md border border-gray-300 p-3 transition focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Campo de Senha */}
          <div className="mb-6">
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading} // Bloqueia input durante loading
              className="w-full rounded-md border border-gray-300 p-3 transition focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Exibição de Erro */}
          {error && (
            <div className="mb-4 rounded bg-red-50 p-3 text-center text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Botão de Entrar com Animação */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-blue-600 p-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}