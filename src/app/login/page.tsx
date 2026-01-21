// src/app/login/page.tsx
'use client'; // ESSENCIAL: Torna este um Componente de Cliente

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = await signIn('credentials', {
        redirect: false, // Importante para lidar com o resultado aqui
        email,
        password,
      });

      if (result?.error) {
        setError('Credenciais inválidas. Verifique seu email e senha.');
        return;
      }

      // Se o login for bem-sucedido, redireciona para o dashboard
      router.push('/dashboard');

    } catch (error) {
      setError('Ocorreu um erro ao tentar fazer login.');
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
              className="w-full rounded-md border border-gray-300 p-3 transition focus:border-blue-500 focus:ring-blue-500"
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
              className="w-full rounded-md border border-gray-300 p-3 transition focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Exibição de Erro */}
          {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}

          {/* Botão de Entrar */}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 p-3 text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}