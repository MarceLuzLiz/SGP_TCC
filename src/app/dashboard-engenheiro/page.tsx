import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users, Route, NotebookText, ListChecks, ArrowRight, ShieldCheck } from 'lucide-react';

export default function EngenheiroDashboardHome() {
  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas Clean com Toque Teal */}
      <div className="relative overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/70 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-900 dark:to-slate-950 p-6 md:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
            <ShieldCheck className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            Painel de Engenharia & Gestão
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Sistema de Gerenciamento de Pavimentos
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Selecione uma área abaixo para gerenciar o cadastro de vias, acompanhar a equipe de campo, auditar ocorrências e emitir laudos técnicos de IGG.
          </p>
        </div>
      </div>

      {/* Grid de Módulos Principais com Transição Suave e Sedosa (350ms) */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Card 1: Vias e Trechos */}
        <Link href="/dashboard-engenheiro/vias" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <Route className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Vias e Trechos
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Visualizar traçados nos mapas, criar novos trechos e analisar o estaqueamento.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 2: Equipe */}
        <Link href="/dashboard-engenheiro/equipe" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Equipe de Fiscais
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gerenciar fiscais de campo e acompanhar as atribuições de vistorias.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 3: Aprovações */}
        <Link href="/dashboard-engenheiro/aprovacoes" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <ListChecks className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Fila de Aprovações
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Revisar laudos de patologias (RFT e RDS) submetidos pelos fiscais.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>

        {/* Card 4: Relatórios */}
        <Link href="/dashboard-engenheiro/relatorios" className="group">
          <Card className="h-full rounded-2xl border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-350 ease-in-out">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-6">
              <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3.5 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-350 ease-in-out">
                <NotebookText className="h-7 w-7" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-350 ease-in-out">
                    Relatórios & IGG
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-350 ease-in-out" />
                </div>
                <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gerar relatórios consolidados e exportar laudos técnicos em PDF.
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}