import { ReactNode } from 'react';
import Link from 'next/link';
// Importe aqui seu componente de Header/Logout, se tiver um
// import { UserNav } from '@/components/ui/user-nav';
import { UserNav } from '@/components/auth/UserNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          {/* Links do Admin */}
          <Link
            href="/dashboard-admin/cancelamentos"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Solicitações de Cancelamento
          </Link>
          <Link
            href="/dashboard-admin/usuarios"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Gestão de Usuários
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