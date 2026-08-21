import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserNav } from '@/components/auth/UserNav';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 md:px-6">
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Brand Logo Oficial */}
          <Link
            href="/dashboard-admin"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90 mr-2"
          >
            <div className="h-8.5 w-8.5 overflow-hidden rounded-lg shadow-xs border border-slate-100 dark:border-slate-800">
              <Image
                src="/logo.png"
                alt="SGP Pavimentos Logo"
                width={34}
                height={34}
                className="h-full w-full object-cover rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg leading-none tracking-tight text-teal-800 dark:text-teal-400">
                SGP
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                Administração
              </span>
            </div>
          </Link>

          {/* Links do Admin */}
          <Link
            href="/dashboard-admin/usuarios"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Gestão de Usuários
          </Link>
          <Link
            href="/dashboard-admin/cancelamentos"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancelamentos
          </Link>
          <Link
            href="/dashboard-admin/exclusoes"
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Exclusões
          </Link>
        </nav>
        <div className="ml-auto">
          <UserNav />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}