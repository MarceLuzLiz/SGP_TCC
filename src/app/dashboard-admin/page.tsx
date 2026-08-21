import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, FileX, Trash2, ArrowRight, ShieldAlert } from 'lucide-react';

export default function AdminDashboardHome() {
  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas do Administrador */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            Painel Administrativo
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Controle e Governança do SGP
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Gerencie o ciclo de vida dos usuários, audite solicitações de cancelamento de relatórios e autorize exclusões definitivas no sistema.
          </p>
        </div>
      </div>

      {/* Grid de Módulos Administrativos com Efeito Padrão de Hover Roxo */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Card 1: Gestão de Usuários */}
        <Link href="/dashboard-admin/usuarios" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Gestão de Usuários
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Cadastrar novos engenheiros e fiscais, suspender ou reativar acessos.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 2: Cancelamentos */}
        <Link href="/dashboard-admin/cancelamentos" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <FileX className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Cancelamentos
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Avaliar e aprovar pedidos de cancelamento de relatórios e laudos.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 3: Exclusões & Suspensões */}
        <Link href="/dashboard-admin/exclusoes" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <Trash2 className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Exclusões
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Revisar solicitações de exclusão e suspensão definitiva de vias e trechos.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
