import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PhotoGrid } from './_components/PhotoGrid';

async function getGalleryData(
  trechoId: string,
  from?: string,
  to?: string,
  codigo?: string,
  ocorrenciaId?: string,
) {
  const whereClause: Prisma.FotoWhereInput = { trechoId };

  if (from || to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) {
      dateFilter.gte = new Date(from);
    }
    if (to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter.lt = endDate;
    }
    whereClause.dataCaptura = dateFilter;
  }

  if (codigo) {
    whereClause.patologia = { codigoDnit: codigo };
  }

  if (ocorrenciaId) {
    whereClause.rdsOcorrenciaId = ocorrenciaId;
  }

  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true,
      fotos: {
        where: whereClause,
        include: { patologia: true, rdsOcorrencia: true },
        orderBy: { dataCaptura: 'desc' },
      },
    },
  });

  const allPatologias = await prisma.patologia.findMany({
    orderBy: { codigoDnit: 'asc' },
  });
  const allRdsOcorrencias = await prisma.rdsOcorrencia.findMany({
    orderBy: [{ categoria: 'asc' }, { ocorrencia: 'asc' }],
  });

  return { trecho, allPatologias, allRdsOcorrencias };
}

export default async function GaleriaPage({
  params,
  searchParams,
}: {
  params: Promise<{ trechoId: string }>;
  searchParams: Promise<{
    from?: string;
    to?: string;
    codigo?: string;
    ocorrencia?: string;
    tab?: string;
  }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { trecho, allPatologias, allRdsOcorrencias } = await getGalleryData(
    resolvedParams.trechoId,
    resolvedSearchParams.from,
    resolvedSearchParams.to,
    resolvedSearchParams.codigo,
    resolvedSearchParams.ocorrencia,
  );

  if (!trecho) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard-engenheiro/trechos/${resolvedParams.trechoId}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para {trecho.nome}
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Galeria de Fotos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trecho: {trecho.nome} ({trecho.fotos.length} fotos encontradas)
          </p>
        </div>
      </div>

      <PhotoGrid
        initialFotos={trecho.fotos}
        trechoId={trecho.id}
        allPatologias={allPatologias}
        allRdsOcorrencias={allRdsOcorrencias}
      />
    </div>
  );
}