// src/app/dashboard/trechos/[trechoId]/vistorias/[vistoriaId]/page.tsx

import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, PlusCircle, FileText, CalendarDays, FileCheck2 } from 'lucide-react';
import { RelatorioStatusCard } from '../_components/RelatorioStatusCard';

const prisma = new PrismaClient();

async function getVistoriaDetails(vistoriaId: string) {
  return await prisma.vistoria.findUnique({
    where: { id: vistoriaId },
    include: {
      trecho: { include: { via: true } },
      relatorios: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export default async function VistoriaDetailPage({ params }: { params: Promise<{ trechoId: string, vistoriaId: string }> }) {
  const resolvedParams = await params;
  const vistoria = await getVistoriaDetails(resolvedParams.vistoriaId);

  if (!vistoria) notFound();

  // Filtra os relatórios por tipo
  const rfts = vistoria.relatorios.filter(r => r.tipo === 'RFT');
  const rds = vistoria.relatorios.filter(r => r.tipo === 'RDS');

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        {/* ... (links do breadcrumb como nas outras páginas) ... */}
        <Link href={`/dashboard/trechos/${vistoria.trecho.id}/vistorias`} className="hover:underline">Vistorias</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes da Vistoria</span>
      </nav>

      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800">Vistoria de {new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</h1>
        <p className="text-gray-600 mt-2"><strong>Motivo:</strong> {vistoria.motivo}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  {/* Seção RFT */}
  <div>
    <h2 className="text-xl font-semibold mb-4">Relatório Fotográfico (RFT)</h2>
    <RelatorioStatusCard
      relatorio={rfts[0]} // Passa o primeiro RFT encontrado, ou undefined
      tipo="RFT"
      trechoId={vistoria.trechoId}
    />
  </div>

  {/* Seção RDS */}
  <div>
    <h2 className="text-xl font-semibold mb-4">Relatório Diário de Serviço (RDS)</h2>
    <RelatorioStatusCard
      relatorio={rds[0]} // Passa o primeiro RDS encontrado, ou undefined
      tipo="RDS"
      trechoId={vistoria.trechoId}
    />
  </div>
</div>
    </div>
  );
}