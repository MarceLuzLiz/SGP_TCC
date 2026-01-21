// src/app/dashboard/trechos/[trechoId]/page.tsx

import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ChevronRight, 
  ClipboardList, 
  GalleryHorizontal, 
  FileText, 
  CalendarDays 
} from 'lucide-react';
import { formatKmToStakes } from '@/lib/formatters';

const prisma = new PrismaClient();

async function getTrechoDetails(trechoId: string) {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true, // Incluímos a via para o breadcrumb
    },
  });
  return trecho;
}

export default async function TrechoPage({ params }: { params: Promise<{ trechoId: string }> }) {
  const resolvedParams = await params;
  const trecho = await getTrechoDetails(resolvedParams.trechoId);

  if (!trecho) {
    notFound(); // Se o trecho não existir, mostra uma página 404
  }

  // URLs para os cards (ainda não existem, mas já deixamos preparado)
  const vistoriasUrl = `/dashboard/trechos/${trecho.id}/vistorias`;
  const galeriaUrl = `/dashboard/trechos/${trecho.id}/galeria`;
  const rftUrl = `/dashboard/trechos/${trecho.id}/rft`;
  const rdsUrl = `/dashboard/trechos/${trecho.id}/rds`;
  const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);

  return (
    <div>
      {/* Breadcrumb de Navegação */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href="/dashboard/vias" className="hover:underline">Minhas Vias</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={`/dashboard/vias/${trecho.via.id}`} className="hover:underline">
          {trecho.via.name}
        </Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">{trecho.nome}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-gray-800">{trecho.nome}</h1>
      <p className="mb-8 text-gray-500">
        {/* Exibe a extensão calculada */}
        Extensão: {extensaoKm.toFixed(2)} km
        <span className="text-gray-400 mx-2">|</span>
        Localizado entre a estaca {formatKmToStakes(trecho.kmInicial)} e a {formatKmToStakes(trecho.kmFinal)}
        </p>

      {/* Grid com os 4 cards de ação */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card Vistorias */}
        <Link href={vistoriasUrl} className="group block rounded-lg bg-white p-6 shadow-md transition hover:ring-2 hover:ring-blue-500">
          <ClipboardList className="h-8 w-8 text-blue-500 transition group-hover:scale-110" />
          <h2 className="mt-4 text-lg font-bold text-gray-800">Vistorias</h2>
          <p className="mt-1 text-sm text-gray-600">Registrar e consultar visitas técnicas.</p>
        </Link>
        
        {/* Card Galeria */}
        <Link href={galeriaUrl} className="group block rounded-lg bg-white p-6 shadow-md transition hover:ring-2 hover:ring-purple-500">
          <GalleryHorizontal className="h-8 w-8 text-purple-500 transition group-hover:scale-110" />
          <h2 className="mt-4 text-lg font-bold text-gray-800">Galeria</h2>
          <p className="mt-1 text-sm text-gray-600">Visualizar e gerenciar fotos de patologias.</p>
        </Link>

        {/* Card RFT */}
        <Link href={rftUrl} className="group block rounded-lg bg-white p-6 shadow-md transition hover:ring-2 hover:ring-teal-500">
          <FileText className="h-8 w-8 text-teal-500 transition group-hover:scale-110" />
          <h2 className="mt-4 text-lg font-bold text-gray-800">RFT</h2>
          <p className="mt-1 text-sm text-gray-600">Criar Relatórios Fotográficos.</p>
        </Link>

        {/* Card RDS */}
        <Link href={rdsUrl} className="group block rounded-lg bg-white p-6 shadow-md transition hover:ring-2 hover:ring-orange-500">
          <CalendarDays className="h-8 w-8 text-orange-500 transition group-hover:scale-110" />
          <h2 className="mt-4 text-lg font-bold text-gray-800">RDS</h2>
          <p className="mt-1 text-sm text-gray-600">Criar Relatórios Diários de Serviço.</p>
        </Link>
      </div>
    </div>
  );
}