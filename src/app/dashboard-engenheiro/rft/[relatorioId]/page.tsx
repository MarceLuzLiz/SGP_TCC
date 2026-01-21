// src/app/dashboard-engenheiro/rft/[relatorioId]/page.tsx

import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
// 1. IMPORTAR OS COMPONENTES NECESSÁRIOS
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';
import { ApprovalActions } from '@/app/dashboard-engenheiro/equipe/_components/approval-actions'; // (Verifique este caminho)
import { ReproveFeedback } from './_components/ReproveFeedback'; // (Criaremos a seguir)
import { DownloadPdfButton } from '@/components/pdf/DownloadPdfButton';


const prisma = new PrismaClient();

async function getRelatorioDetails(relatorioId: string) {
  return await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
      // --- ADICIONE ESTAS DUAS LINHAS ---
      user: { select: { name: true } },     // Traz o nome do criador
      approver: { select: { name: true } }, // Traz o nome do aprovador
      // ----------------------------------
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

export default async function RFTDetailPage({ params }: { params: Promise<{ relatorioId: string }> }) {
  const resolvedParams = await params;
  const relatorio = await getRelatorioDetails(resolvedParams.relatorioId);

  if (!relatorio || relatorio.tipo !== 'RFT') notFound();

  const fotos = relatorio.fotos.map(f => f.foto);
  
  const statusStyles: { [key: string]: string } = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    APROVADO: 'bg-green-100 text-green-800',
    REPROVADO: 'bg-red-100 text-red-800',
    CORRIGIDO: 'bg-orange-100 text-orange-800',
  };

  const dadosPDF = {
    titulo: "Relatório Fotográfico (RFT)",
    tipo: "RFT",
    trechoNome: relatorio.trecho.nome,
    viaNome: relatorio.trecho.via.name,
    dataVistoria: relatorio.vistoria.dataVistoria,
    criadoPor: relatorio.user.name, // Agora isso vai funcionar!
    aprovadoPor: relatorio.approver?.name || "Pendente", // Usa o nome ou um fallback
    fotos: fotos
  };

  return (
    <div>
      {/* Breadcrumb (Atualizado para o engenheiro) */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard-engenheiro/trechos/${relatorio.trecho.id}`} className="hover:underline">{relatorio.trecho.nome}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes do RFT</span>
      </nav>

      {/* Cabeçalho do Relatório */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Relatório Fotográfico (RFT)</h1>
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
          <DownloadPdfButton 
                   dados={dadosPDF} 
                   fileName={`RFT_${relatorio.trecho.nome}.pdf`} 
                />
        </div>
        
        {/* 3. ADICIONAR FEEDBACK DE REPROVAÇÃO (Se houver) */}
        {relatorio.statusAprovacao === 'REPROVADO' && relatorio.motivoReprovacao && (
           <ReproveFeedback motivo={relatorio.motivoReprovacao} />
        )}
      </div>

      {/* Galeria de Fotos do Relatório */}
      <h2 className="text-xl font-semibold mb-4">Fotos Inclusas no Relatório</h2>
      <RelatorioPhotoGrid fotos={fotos} />
    </div>
  );
}