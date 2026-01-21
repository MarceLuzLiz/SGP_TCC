import { ReactNode } from 'react';
import Link from 'next/link';
// Importe aqui seu componente de Header/Logout, se tiver um
// import { UserNav } from '@/components/ui/user-nav'; 
import { UserNav } from '@/components/auth/UserNav';

interface EngenheiroLayoutProps {
  children: ReactNode;
}

export default function EngenheiroLayout({ children }: EngenheiroLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="/dashboard-engenheiro"
            className="font-bold text-2xl text-blue-600 transition-colors hover:text-foreground"
        >
            SGP
          </Link>
          <Link
            href="/dashboard-engenheiro/vias"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Vias & Trechos
          </Link>
          <Link
            href="/dashboard-engenheiro/equipe"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Equipe
          </Link>
          <Link
            href="/dashboard-engenheiro/aprovacoes"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Aprovações
          </Link>
          <Link
            href="/dashboard-engenheiro/relatorios"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Relatórios
          </Link>
        </nav>
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}