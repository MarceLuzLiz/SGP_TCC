import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Route, UserCheck, ArrowRight, HardHat } from 'lucide-react';

export default function FiscalDashboardHome() {
  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas do Fiscal */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <HardHat className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            Painel de Campo & Vistorias
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Minhas Atividades de Fiscalização
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Consulte as vias atribuídas ao seu usuário para realizar levantamentos, registrar inventários e consultar laudos técnicos.
          </p>
        </div>
      </div>

      {/* Grid de Módulos do Fiscal com Efeito Padrão de Hover Roxo */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Card 1: Minhas Vias */}
        <Link href="/dashboard/vias" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <Route className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Minhas Vias
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Acessar vias e trechos cadastrados que estão atribuídos para sua fiscalização.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 2: Meu Perfil */}
        <Link href="/dashboard/profile" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <UserCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Meu Perfil
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Visualizar suas credenciais de acesso, dados da conta e permissões de fiscal.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}