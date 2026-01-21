import { Prisma, PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { PhotoGrid } from './_components/PhotoGrid'; // Importa o componente local

const prisma = new PrismaClient();

// Esta é a sua função de busca de dados, perfeita para esta página
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

// Usando a sua convenção do Next 15.5
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
    <div>
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        {/* --- CORREÇÃO DO LINK --- */}
        <Link
          href={`/dashboard-engenheiro/trechos/${resolvedParams.trechoId}`}
          className="hover:underline"
        >
          {trecho.nome}
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Galeria</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Galeria de Fotos</h1>
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