import { PrismaClient, Prisma, StatusAprovacao } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, FilePlus } from 'lucide-react';
import { RDSList } from './_components/RDSList';
import { DateFilter } from '@/app/dashboard/_components/DateFilter';
import { StatusFilter } from '@/app/dashboard/_components/StatusFilter';

const prisma = new PrismaClient();

async function getRDSData(trechoId: string, from?: string, to?: string, statuses?: string[]) {
  const whereClause: Prisma.RelatorioWhereInput = { tipo: 'RDS', trechoId: trechoId };

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
    whereClause.createdAt = dateFilter;
  }
  
  if (statuses && statuses.length > 0) {
    whereClause.statusAprovacao = { in: statuses as StatusAprovacao[] };
  }

  return await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true,
      relatorios: { where: whereClause, orderBy: { createdAt: 'desc' } },
    },
  });
}

export default async function RDSListPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ trechoId: string }>, 
  searchParams: Promise<{ from?: string, to?: string, status?: string | string[] }> 
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const statuses = Array.isArray(resolvedSearchParams.status) 
    ? resolvedSearchParams.status 
    : (resolvedSearchParams.status ? [resolvedSearchParams.status] : []);

  const trecho = await getRDSData(
    resolvedParams.trechoId, 
    resolvedSearchParams.from, 
    resolvedSearchParams.to, 
    statuses
  );

  if (!trecho) notFound();

  return (
    <div>
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard/trechos/${resolvedParams.trechoId}`} className="hover:underline">{trecho.nome}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Relatórios Diários de Serviço (RDS)</span>
      </nav>
      
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Relatórios Diários de Serviço</h1>
        <Link href={`/dashboard/trechos/${resolvedParams.trechoId}/rds/new`} className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-white transition hover:bg-orange-700">
          <FilePlus size={18} />
          Criar Novo RDS
        </Link>
      </div>

      <DateFilter />
      <StatusFilter />

      <RDSList relatorios={trecho.relatorios} trechoId={trecho.id} />
    </div>
  );
}