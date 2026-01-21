// src/app/dashboard/trechos/[trechoId]/rft/[relatorioId]/page.tsx

import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';

const prisma = new PrismaClient();

async function getRelatorioDetails(relatorioId: string) {
  return await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
      fotos: { 
        include: { 
          foto: {
            // CORREÇÃO: Inclui os dados aninhados para exibir no RelatorioPhotoGrid
            include: { patologia: true, rdsOcorrencia: true }
          } 
        } 
      },
    },
  });
}

export default async function RFTDetailPage({ params }: { params: Promise<{ trechoId: string, relatorioId: string }> }) {
  const resolvedParams = await params;
  const relatorio = await getRelatorioDetails(resolvedParams.relatorioId);

  if (!relatorio || relatorio.tipo !== 'RFT') notFound();

  const fotos = relatorio.fotos.map(f => f.foto); // Extrai apenas os dados das fotos
  
  const statusStyles: { [key: string]: string } = {
  PENDENTE: 'bg-yellow-100 text-yellow-800',
  APROVADO: 'bg-green-100 text-green-800',
  REPROVADO: 'bg-red-100 text-red-800', // Nova cor
  CORRIGIDO: 'bg-orange-100 text-orange-800', // Nova cor
};

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        {/* ... (links do breadcrumb) ... */}
        <Link href={`/dashboard/trechos/${relatorio.trecho.id}/rft`} className="hover:underline">RFTs</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes do RFT</span>
      </nav>

      {/* Cabeçalho do Relatório */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Relatório Fotográfico (RFT)</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="font-semibold block text-gray-500">Trecho</span>{relatorio.trecho.nome}</div>
          <div><span className="font-semibold block text-gray-500">Data da Vistoria</span>{new Date(relatorio.vistoria.dataVistoria).toLocaleDateString('pt-BR')}</div>
          <div><span className="font-semibold block text-gray-500">Data de Criação</span>{new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</div>
          <div><span className="font-semibold block text-gray-500">Status</span>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[relatorio.statusAprovacao]}`}>
              {relatorio.statusAprovacao}
            </span>
          </div>
        </div>
      </div>

      {/* Galeria de Fotos do Relatório */}
      <h2 className="text-xl font-semibold mb-4">Fotos Inclusas no Relatório</h2>
      <RelatorioPhotoGrid fotos={fotos} />
    </div>
  );
}