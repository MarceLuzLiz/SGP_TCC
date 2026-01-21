import { PrismaClient, StatusAprovacao } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { RFTEditor } from '../../_components/RFTEditor';

const prisma = new PrismaClient();

async function getEditData(relatorioId: string) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      vistoria: true,
      fotos: { 
        include: { 
          foto: {
            // CORREÇÃO: Inclui os dados aninhados para as fotos já selecionadas
            include: { patologia: true, rdsOcorrencia: true }
          } 
        } 
      },
    },
  });

  if (!relatorio) return null;

  const fotosDaVistoria = await prisma.foto.findMany({
    where: {
      vistoriaId: relatorio.vistoriaId,
      tipo: 'RFT',
    },
    // CORREÇÃO: Inclui os dados para a lista de todas as fotos selecionáveis
    include: {
      patologia: true,
      rdsOcorrencia: true,
    }
  });

  return { relatorio, fotosDaVistoria };
}

export default async function RFTEditPage({ params }: { params: Promise<{ trechoId: string, relatorioId: string }> }) {
  const resolvedParams = await params;
  const data = await getEditData(resolvedParams.relatorioId);

  if (!data) notFound();

  if (data.relatorio.statusAprovacao !== StatusAprovacao.PENDENTE && data.relatorio.statusAprovacao !== StatusAprovacao.REPROVADO) {
    redirect(`/dashboard/trechos/${resolvedParams.trechoId}/rft/${resolvedParams.relatorioId}`);
  }

  return (
    <div>
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard/trechos/${resolvedParams.trechoId}/rft`} className="hover:underline">RFTs</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Editar RFT</span>
      </nav>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Editar Relatório Fotográfico</h1>
        <RFTEditor
          relatorio={data.relatorio}
          fotosDaVistoria={data.fotosDaVistoria}
          trechoId={resolvedParams.trechoId}
        />
      </div>
    </div>
  );
}