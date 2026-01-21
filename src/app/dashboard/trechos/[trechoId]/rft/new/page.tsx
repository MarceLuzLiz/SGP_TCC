import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { RFTCreator } from '../_components/RFTCreator';

const prisma = new PrismaClient();

async function getCreationData(trechoId: string) {
  return await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true,
      vistorias: { orderBy: { dataVistoria: 'desc' } },
      fotos: {
        where: { tipo: 'RFT' },
        // CORREÇÃO: Inclui os dados da patologia para cada foto
        include: {
          patologia: true,
          rdsOcorrencia: true,
        },
        orderBy: { dataCaptura: 'desc' },
      },
    },
  });
}

export default async function RFTCreatePage({ params }: { params: Promise<{ trechoId: string }> }) {
  const resolvedParams = await params;
  const trecho = await getCreationData(resolvedParams.trechoId);

  if (!trecho) notFound();

  return (
    <div>
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard/trechos/${resolvedParams.trechoId}/rft`} className="hover:underline">RFTs</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Criar Novo RFT</span>
      </nav>
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Criar Novo Relatório Fotográfico</h1>
        <RFTCreator vistorias={trecho.vistorias} fotos={trecho.fotos} trechoId={trecho.id} />
      </div>
    </div>
  );
}