'use server';

import prisma from '@/lib/prisma';
import { FotoTipo, StatusAprovacao } from '@prisma/client';

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number; // Será o Fp da patologia
}

export async function getViaHeatmapData(viaId: string): Promise<HeatmapPoint[]> {
  const fotos = await prisma.foto.findMany({
    where: {
      vistoria: {
        trecho: { viaId: viaId },
        // Pegamos apenas fotos de relatórios APROVADOS para o dado ser oficial
        relatorios: { some: { statusAprovacao: StatusAprovacao.APROVADO } }
      },
      tipo: FotoTipo.RFT,
      patologiaId: { not: null } // Só interessa foto com patologia
    },
    select: {
      latitude: true,
      longitude: true,
      patologia: {
        select: { fatorPonderacao: true }
      }
    }
  });

  // Transforma no formato que o Google Maps entende
  const heatmapData: HeatmapPoint[] = fotos
    .filter(f => f.latitude && f.longitude && f.patologia?.fatorPonderacao)
    .map(foto => ({
      lat: foto.latitude!,
      lng: foto.longitude!,
      // O peso é o Fp. Quanto maior, mais "quente".
      weight: foto.patologia!.fatorPonderacao
    }));

  return heatmapData;
}