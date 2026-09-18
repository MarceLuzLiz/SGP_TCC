import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Route, MapPin, Milestone, ArrowRight, Layers } from 'lucide-react';
import { formatKmToStakes } from '@/lib/formatters';

async function getViasDoUsuario(userId: string) {
  const assignments = await prisma.userViaAssignment.findMany({
    where: { userId: userId },
    include: {
      via: {
        include: {
          trechos: { select: { id: true } },
        },
      },
    },
  });
  return assignments.map((assignment) => assignment.via);
}

export default async function ViasPage() {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    redirect('/login');
  }

  // @ts-expect-error Corrigido
  const vias = await getViasDoUsuario(session.user.id);

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100/70 dark:bg-teal-900/50 px-3 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300 w-fit">
          <Route className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
          Vias Atribuídas
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-2">
          Minhas Vias
        </h1>
        <p className="text-sm text-muted-foreground">
          Vias públicas sob sua responsabilidade para levantamento de campo e vistoria técnica.
        </p>
      </div>

      {vias.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <Route className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Nenhuma via foi atribuída a você no momento.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Entre em contato com o engenheiro responsável para liberação de trechos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {vias.map((via) => (
            <Link
              href={`/dashboard/vias/${via.id}`}
              key={via.id}
              className="group block rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="rounded-2xl bg-teal-50 dark:bg-teal-950/70 border border-teal-100/60 dark:border-teal-900/40 p-3 text-teal-800 dark:text-teal-300 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/70 group-hover:border-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 group-hover:scale-105 transition-all duration-300">
                  <Route className="h-6 w-6" />
                </div>
                <ArrowRight className="h-4 w-4 text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors mb-2">
                {via.name}
              </h2>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center">
                  <MapPin className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{via.bairro}, {via.municipio} - {via.estado}</span>
                </p>
                <p className="flex items-center">
                  <Milestone className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>
                    Extensão: {via.extensaoKm.toFixed(2)} km ({formatKmToStakes(via.extensaoKm)} Estacas)
                  </span>
                </p>
                <p className="flex items-center pt-1">
                  <Layers className="mr-2 h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-foreground">
                    {via.trechos?.length || 0} {via.trechos?.length === 1 ? 'trecho cadastrado' : 'trechos cadastrados'}
                  </span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}