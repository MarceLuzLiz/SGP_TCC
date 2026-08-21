'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Route, Users, ListChecks, NotebookText, LayoutDashboard } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard-engenheiro', label: 'Visão Geral', icon: LayoutDashboard, exact: true },
  { href: '/dashboard-engenheiro/vias', label: 'Vias & Trechos', icon: Route },
  { href: '/dashboard-engenheiro/equipe', label: 'Equipe', icon: Users },
  { href: '/dashboard-engenheiro/aprovacoes', label: 'Aprovações', icon: ListChecks },
  { href: '/dashboard-engenheiro/relatorios', label: 'Relatórios', icon: NotebookText },
];

export function EngenheiroNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
      {/* Brand Logo Oficial Natural */}
      <Link
        href="/dashboard-engenheiro"
        className="mr-5 flex items-center gap-2.5 transition-opacity hover:opacity-90"
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
            Pavimentos
          </span>
        </div>
      </Link>

      {/* Menus de Navegação */}
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);

        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              isActive
                ? 'bg-teal-50 text-teal-900 border border-teal-200/60 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800/40 shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 ${
                isActive ? 'text-teal-700 dark:text-teal-300' : 'text-muted-foreground'
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default EngenheiroNav;
