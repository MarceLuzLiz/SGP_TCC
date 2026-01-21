// src/app/dashboard-engenheiro/rds/[relatorioId]/page.tsx

import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
// 1. IMPORTAR OS COMPONENTES NECESSÁRIOS
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';
import { ApprovalActions } from '@/app/dashboard-engenheiro/equipe/_components/approval-actions'; // (Verifique este caminho)
import { ReproveFeedback } from '../../rft/[relatorioId]/_components/ReproveFeedback'; // Reutiliza o componente
import { DownloadRdsPdfButton } from '@/components/pdf/DownloadRdsPdfButton';

const prisma = new PrismaClient();

async function getRelatorioDetails(relatorioId: string) {
  // ... (Sua função getRelatorioDetails - sem mudança) ...
  return await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
      user: { select: { name: true } },
      approver: { select: { name: true } },
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

interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

export default async function RDSDetailPage({ params }: { params: Promise<{ relatorioId: string }> }) {
  const resolvedParams = await params;
  const relatorio = await getRelatorioDetails(resolvedParams.relatorioId);

  if (!relatorio || relatorio.tipo !== 'RDS') notFound();

  const fotos = relatorio.fotos.map(f => f.foto);
  const dados: DadosRDS = relatorio.dadosJson ? JSON.parse(relatorio.dadosJson) : {};

  const statusStyles: { [key: string]: string } = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    APROVADO: 'bg-green-100 text-green-800',
    REPROVADO: 'bg-red-100 text-red-800',
    CORRIGIDO: 'bg-orange-100 text-orange-800',
  };

  const dadosPDF = {
    titulo: "Relatório Diário de Serviço (RDS)",
    tipo: "RDS",
    trechoNome: relatorio.trecho.nome,
    viaNome: relatorio.trecho.via.name,
    dataVistoria: relatorio.vistoria.dataVistoria,
    criadoPor: relatorio.user.name, // Agora existe
    aprovadoPor: relatorio.approver?.name || "Pendente",
    fotos: fotos,
    dadosRDS: dados // O objeto JSON parseado (clima, horarios, etc)
  };

  return (
    <div>
      {/* Breadcrumb (Atualizado para o engenheiro) */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard-engenheiro/trechos/${relatorio.trecho.id}`} className="hover:underline">{relatorio.trecho.nome}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes do RDS</span>
      </nav>

      {/* Cabeçalho do Relatório */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Relatório Diário de Serviço (RDS)</h1>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><span className="font-semibold block text-gray-500">Trecho</span>{relatorio.trecho.nome}</div>
              <div><span className="font-semibold block text-gray-500">Data da Vistoria</span>{new Date(relatorio.vistoria.dataVistoria).toLocaleDateString('pt-BR')}</div>
              <div><span className="font-semibold block text-gray-500">Data de Criação</span>{new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</div>
              <div><span className="font-semibold block text-gray-500">Criado por:</span>{relatorio.user.name}</div>
              <div><span className="font-semibold block text-gray-500">Status</span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[relatorio.statusAprovacao]}`}>
                  {relatorio.statusAprovacao}
                </span>
              </div>
            </div>
          </div>
          
          {/* 2. ADICIONAR BOTÕES DE AÇÃO (Apenas se pendente/corrigido) */}
          {(relatorio.statusAprovacao === 'PENDENTE' || relatorio.statusAprovacao === 'CORRIGIDO') && (
            <div className="shrink-0">
              <ApprovalActions
                relatorio={{ id: relatorio.id, trechoId: relatorio.trechoId }}
              />
            </div>
          )}

          <DownloadRdsPdfButton 
              dados={dadosPDF}
              fileName={`RDS_${relatorio.trecho.nome}.pdf`}
            />
        </div>

        {/* 3. ADICIONAR FEEDBACK DE REPROVAÇÃO (Se houver) */}
        {relatorio.statusAprovacao === 'REPROVADO' && relatorio.motivoReprovacao && (
           <ReproveFeedback motivo={relatorio.motivoReprovacao} />
        )}
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
      {fotos.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Fotos Anexadas</h2>
          <RelatorioPhotoGrid fotos={fotos} />
        </>
      )}
    </div>
  );
}