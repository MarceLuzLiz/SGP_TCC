// src/app/dashboard/trechos/[trechoId]/rds/[relatorioId]/page.tsx

import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, CalendarDays } from 'lucide-react';
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';

const prisma = new PrismaClient();

// A função de busca é a mesma do RFT
async function getRelatorioDetails(relatorioId: string) {
  return await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
      fotos: { 
        include: { 
          foto: {
            include: { patologia: true, rdsOcorrencia: true }
          } 
        } 
      },
    },
  });
}

// Interface para tipar os dados do JSON
interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

export default async function RDSDetailPage({ params }: { params: Promise<{ trechoId: string, relatorioId: string }> }) {
  const resolvedParams = await params;
  const relatorio = await getRelatorioDetails(resolvedParams.relatorioId);

  if (!relatorio || relatorio.tipo !== 'RDS') notFound();

  const fotos = relatorio.fotos.map(f => f.foto);
  // Converte a string JSON de volta para um objeto
  const dados: DadosRDS = relatorio.dadosJson ? JSON.parse(relatorio.dadosJson) : {};

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
        <Link href={`/dashboard/trechos/${relatorio.trecho.id}/rds`} className="hover:underline">RDSs</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes do RDS</span>
      </nav>

      {/* Cabeçalho do Relatório */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Relatório Diário de Serviço (RDS)</h1>
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
      
      {/* Detalhes do RDS */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Informações do Serviço</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div><span className="font-semibold block text-gray-500">Clima</span>{dados.clima || 'N/A'}</div>
          <div><span className="font-semibold block text-gray-500">Entrada</span>{dados.horarioEntrada || 'N/A'}</div>
          <div><span className="font-semibold block text-gray-500">Saída</span>{dados.horarioSaida || 'N/A'}</div>
          <div className="md:col-span-3"><span className="font-semibold block text-gray-500">Anotações</span><p className="mt-1 whitespace-pre-wrap">{dados.anotacoes || 'Nenhuma.'}</p></div>
          <div className="md:col-span-3"><span className="font-semibold block text-gray-500">Ocorrências</span><p className="mt-1 whitespace-pre-wrap">{dados.ocorrencias || 'Nenhuma.'}</p></div>
        </div>
      </div>

      {/* Galeria de Fotos do Relatório */}
      {/* Galeria de Fotos do Relatório */}
        {fotos.length > 0 && (
        <>
            <h2 className="text-xl font-semibold mb-4">Fotos Anexadas</h2>
          <RelatorioPhotoGrid fotos={fotos} />
        </>
        )}
    </div>
  );
}