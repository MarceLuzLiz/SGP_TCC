// src/app/dashboard/layout.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserMenu } from './_components/UserMenu'
import Link from 'next/link';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Busca a sessão no servidor
  const session = await getServerSession(authOptions);
  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* Barra Lateral (Sidebar) - Placeholder */}
      

      {/* Conteúdo Principal */}
      <main className="flex-1">
        {/* Cabeçalho (Header) ATUALIZADO */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-8">
          <div>
          <nav className="hidden items-center flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          {/* Links do Admin */}

          <Link href="/dashboard" className="text-2xl font-bold text-blue-600">SGP</Link>
          
          <Link
            href="/dashboard"
            className=" pl-4 text-muted-foreground transition-colors hover:text-foreground"
          >
            Início
          </Link>
          <Link
            href="/dashboard/vias"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Mnhas vias
          </Link>
          <Link
            href="/dashboard/profile"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Meu perfil
          </Link>
        </nav>
        </div>
          {/* Renderiza o novo componente com os dados da sessão */}
          <UserMenu session={session} />
          
        </header>

        {/* O conteúdo da página será renderizado aqui */}
        <div className="py-12 px-18">{children}</div>
      </main>
    </div>
  );
}