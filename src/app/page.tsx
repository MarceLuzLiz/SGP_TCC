// src/app/page.tsx

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Verifica se há uma sessão ativa
  if (session) {
    // Se o usuário está logado, redireciona para o dashboard
    redirect('/dashboard');
  } else {
    // Se não está logado, redireciona para a página de login
    redirect('/login');
  }

  // Este componente não renderiza nada visualmente,
  // apenas executa a lógica de redirecionamento no servidor.
  return null;
}