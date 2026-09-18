import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { User, Map, ClipboardList, AlertTriangle, CheckCircle, Route, ArrowRight } from 'lucide-react';
import { ReprovadoCard } from './_components/ReprovadoCard';

async function getProfileData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const assignedVias = await prisma.userViaAssignment.findMany({
    where: { userId },
    include: { via: true },
  });

  const vistorias = await prisma.vistoria.findMany({
    where: { userId },
    orderBy: { dataVistoria: 'desc' },
    take: 5,
  });

  const relatorios = await prisma.relatorio.findMany({
    where: { userId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  const rftStats = {
    pendentes: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'PENDENTE').length,
    aprovados: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO').length,
    reprovados: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'REPROVADO').length,
    corrigidos: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'CORRIGIDO').length,
  };
  const rdsStats = {
    pendentes: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'PENDENTE').length,
    aprovados: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'APROVADO').length,
    reprovados: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'REPROVADO').length,
    corrigidos: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'CORRIGIDO').length,
  };

  const relatoriosReprovados = relatorios.filter(r => r.statusAprovacao === 'REPROVADO');
  
  const relatoriosAprovados = relatorios
    .filter(r => r.statusAprovacao === 'APROVADO')
    .slice(0, 3);

  return {
    user,
    vias: assignedVias.map(a => a.via),
    vistorias,
    rftStats,
    rdsStats,
    relatoriosReprovados,
    relatoriosAprovados,
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    redirect('/login');
  }

  // @ts-expect-error Corrigido
  const data = await getProfileData(session.user.id);
  
  if (!data.user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Meu Painel de Fiscal
        </h1>
        <p className="text-sm text-muted-foreground">
          Visão consolidada das suas vias atribuídas, métricas de relatórios e notificações de campo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna da Esquerda (Perfil, Vias e Vistorias) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de Informações do Usuário */}
          <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/70 border border-teal-100 dark:border-teal-900/40 rounded-2xl text-teal-700 dark:text-teal-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{data.user.name}</h2>
                <p className="text-xs text-muted-foreground">{data.user.email}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/40 inline-block">
              Cargo: {data.user.role}
            </span>
          </div>

          {/* Card de Vias Atribuídas */}
          <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <Map className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Minhas Vias</h2>
              </div>
              <Link href="/dashboard/vias" className="text-xs text-teal-700 dark:text-teal-400 hover:underline">
                Ver todas
              </Link>
            </div>
            {data.vias.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {data.vias.map(via => (
                  <li key={via.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{via.name}</span>
                    <Link href={`/dashboard/vias/${via.id}`} className="text-slate-400 hover:text-purple-600 dark:hover:text-purple-400">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma via atribuída a você.</p>
            )}
          </div>

          {/* Card de Vistorias Recentes */}
          <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs p-6">
            <div className="flex items-center gap-2.5 mb-4">
              <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Vistorias Recentes</h2>
            </div>
            {data.vistorias.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {data.vistorias.map(v => (
                  <li key={v.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(v.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </p>
                    <p className="text-muted-foreground truncate">{v.motivo}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma vistoria recente.</p>
            )}
          </div>
        </div>

        {/* Coluna da Direita (Status e Notificações) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Status dos Relatórios */}
          <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs p-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Status dos Meus Relatórios
            </h2>
            <div className="space-y-5">
              {/* Status RFT */}
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Relatórios Fotográficos (RFT)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{data.rftStats.pendentes}</p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">Pendentes</p>
                  </div>
                  <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 rounded-xl">
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{data.rftStats.corrigidos}</p>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mt-0.5">Corrigidos</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.rftStats.aprovados}</p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">Aprovados</p>
                  </div>
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-xl">
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{data.rftStats.reprovados}</p>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-0.5">Reprovados</p>
                  </div>
                </div>
              </div>

              {/* Status RDS */}
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2">Relatórios Diários de Serviço (RDS)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
                    <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{data.rdsStats.pendentes}</p>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mt-0.5">Pendentes</p>
                  </div>
                  <div className="p-3.5 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/40 rounded-xl">
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{data.rdsStats.corrigidos}</p>
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mt-0.5">Corrigidos</p>
                  </div>
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
                    <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.rdsStats.aprovados}</p>
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mt-0.5">Aprovados</p>
                  </div>
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-xl">
                    <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{data.rdsStats.reprovados}</p>
                    <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mt-0.5">Reprovados</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card de Ações Necessárias (Reprovados) */}
          {data.relatoriosReprovados.length > 0 && (
            <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-900 shadow-xs p-6">
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Ações Necessárias (Reprovações do Engenheiro)
              </h3>
              <div className="space-y-3">
                {data.relatoriosReprovados.map(r => <ReprovadoCard key={r.id} relatorio={r} />)}
              </div>
            </div>
          )}

          {/* Notificações de Aprovação */}
          {data.relatoriosAprovados.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs p-6">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" /> Relatórios Recentes Aprovados
              </h3>
              <div className="space-y-2.5">
                {data.relatoriosAprovados.map(r => (
                  <Link
                    key={r.id}
                    href={`/dashboard/trechos/${r.trechoId}/${r.tipo.toLowerCase()}/${r.id}`}
                    className="block p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors"
                  >
                    <p className="font-semibold text-xs text-emerald-800 dark:text-emerald-200">
                      Seu {r.tipo} de {new Date(r.vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} foi aprovado!
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {r.trecho.via.name} — {r.trecho.nome}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}