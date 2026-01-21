import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import { getViaHeatmapData } from '@/lib/actions/heatmap-data';
import HeatmapClient from './heatmap-client';

// Se estiver usando o singleton: import prisma from '@/lib/prisma';
const prisma = new PrismaClient();

// 1. Definimos o tipo esperado localmente para fazer o cast
type Coordenada = { lat: number; lng: number };

export default async function MapaCalorPage({
  params,
}: {
  params: Promise<{ viaId: string }>;
}) {
  const { viaId } = await params;

  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: {
      name: true,
      trajetoJson: true,
    },
  });

  if (!via) {
    notFound();
  }

  const heatmapData = await getViaHeatmapData(viaId);

  return (
    <HeatmapClient
      via={{
        name: via.name,
        // CORREÇÃO AQUI:
        // Usamos 'as unknown' como intermediário seguro ao invés de 'as any'.
        // Isso diz ao TS: "Trate isso como desconhecido, e eu garanto que é esse tipo abaixo".
        trajetoJson: via.trajetoJson as unknown as Coordenada[] | string | null
      }}
      heatmapData={heatmapData}
    />
  );
}