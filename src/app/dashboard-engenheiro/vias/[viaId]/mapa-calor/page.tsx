import { notFound } from 'next/navigation';
import { getViaHeatmapData } from '@/lib/actions/heatmap-data';
import HeatmapClient from './heatmap-client';
import prisma from '@/lib/prisma';

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
      viaId={viaId}
      via={{
        name: via.name,
        trajetoJson: via.trajetoJson as unknown as Coordenada[] | string | null
      }}
      heatmapData={heatmapData}
    />
  );
}