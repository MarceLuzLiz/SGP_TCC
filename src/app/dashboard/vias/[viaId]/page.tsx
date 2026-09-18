import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, Construction, MapPin, Milestone } from 'lucide-react';
import { formatKmToStakes } from '@/lib/formatters';

async function getViaDetails(viaId: string) {
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    include: {
      trechos: {
        orderBy: { kmInicial: 'asc' },
      },
    },
  });
  return via;
}

export default async function TrechosPage({ params }: { params: Promise<{ viaId: string }> }) {
  const resolvedParams = await params;
  const via = await getViaDetails(resolvedParams.viaId);

  if (!via) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Botão de Retorno */}
      <Link
        href="/dashboard/vias"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para Minhas Vias
      </Link>

      {/* Header da Via */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {via.name}
        </h1>
        <p className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            {via.bairro}, {via.municipio} - {via.estado}
          </span>
          <span className="h-1 w-1 rounded-full bg-slate-400" />
          <span className="flex items-center gap-1">
            <Milestone className="h-3.5 w-3.5 text-slate-400" />
            Extensão Total: {via.extensaoKm.toFixed(2)} km ({formatKmToStakes(via.extensaoKm)} Estacas)
          </span>
        </p>
      </div>

      {via.trechos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center bg-slate-50/50 dark:bg-slate-900/30">
          <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Nenhum trecho cadastrado para esta via.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Os trechos são delimitados e disponibilizados pelo Engenheiro responsável.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {via.trechos.map((trecho) => {
            const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);
            const estacaInicialFmt = formatKmToStakes(trecho.kmInicial);
            const estacaFinalFmt = formatKmToStakes(trecho.kmFinal);

            return (
              <Link
                key={trecho.id}
                href={`/dashboard/trechos/${trecho.id}`}
                className="group block rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-200 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <span
                      className="h-3.5 w-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: trecho.cor || '#0d9488' }}
                    />
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        {trecho.nome}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Extensão: {extensaoKm.toFixed(2)} km
                        <span className="text-slate-300 dark:text-slate-700 mx-2">|</span>
                        Entre Estaca {estacaInicialFmt} e {estacaFinalFmt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200/60 dark:border-teal-800/40">
                      Abrir Trecho
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}