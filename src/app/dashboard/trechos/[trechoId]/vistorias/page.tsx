// src/app/dashboard/trechos/[trechoId]/vistorias/page.tsx

import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight} from 'lucide-react';
import { CreateVistoriaButton } from './_components/CreateVistoriaButton';
import { VistoriaList } from './_components/VistoriaList';

const prisma = new PrismaClient();

async function getTrechoComVistorias(trechoId: string) {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    include: {
      via: true,
      vistorias: {
        orderBy: {
          dataVistoria: 'desc', // Mostra as mais recentes primeiro
        },
      },
    },
  });
  return trecho;
}

export default async function VistoriasPage({ params }: { params: Promise<{ trechoId: string }> }) {
  const resolvedParams = await params;
  const trecho = await getTrechoComVistorias(resolvedParams.trechoId);

  if (!trecho) {
    notFound();
  }

  return (
    <div>
      {/* Breadcrumb de Navegação */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href="/dashboard/vias" className="hover:underline">Minhas Vias</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={`/dashboard/vias/${trecho.via.id}`} className="hover:underline">{trecho.via.name}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={`/dashboard/trechos/${trecho.id}`} className="hover:underline">{trecho.nome}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Vistorias</span>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Vistorias</h1>
        <CreateVistoriaButton trechoId={trecho.id} />
      </div>

      {/* Renderiza o novo componente de cliente com a lista */}
      <VistoriaList vistorias={trecho.vistorias} trechoId={trecho.id} />
    </div>
  );
}