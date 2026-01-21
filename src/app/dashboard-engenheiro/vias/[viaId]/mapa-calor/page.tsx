import { PrismaClient } from '@prisma/client'; // Ou seu import de @/lib/prisma
import { notFound } from 'next/navigation';
import { getViaHeatmapData } from '@/lib/actions/heatmap-data';
import HeatmapClient from './heatmap-client';

// Se você tiver o singleton do prisma configurado em lib/prisma.ts, use ele:
// import prisma from '@/lib/prisma';
// Caso contrário, instancie aqui (mas prefira o singleton):
const prisma = new PrismaClient();

export default async function MapaCalorPage({
  params,
}: {
  params: Promise<{ viaId: string }>;
}) {
  const { viaId } = await params;

  // 1. Busca os dados da Via
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: {
      name: true,
      trajetoJson: true, // Importante: buscar o trajeto
    },
  });

  if (!via) {
    notFound();
  }

  // 2. Busca os dados do Heatmap (usando a Server Action que criamos)
  const heatmapData = await getViaHeatmapData(viaId);

  // 3. Passa tudo para o componente cliente
  return (
    <HeatmapClient 
      via={via} 
      heatmapData={heatmapData} 
    />
  );
}