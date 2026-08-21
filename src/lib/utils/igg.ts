import prisma from '@/lib/prisma';
import { FotoTipo, Foto, StatusAprovacao, Patologia } from '@prisma/client';

type FotoComPatologia = Foto & {
  patologia: {
    id: string;
    fatorPonderacao: number;
  } | null;
};

// Aplica a regra: floor(Fim) - floor(Início)
function calcularNumeroEstacoes(kmInicial: number, kmFinal: number): number {
  const metrosInicial = kmInicial * 1000;
  const metrosFinal = kmFinal * 1000;
  const n = Math.floor(metrosFinal / 20) - Math.floor(metrosInicial / 20);
  return n > 0 ? n : 1;
}

/**
 * Calcula o IGG (Índice de Gravidade Global) para um Trecho específico,
 * baseado na sua Vistoria mais recente.
 */
export async function calculateIGGForTrecho(trechoId: string): Promise<number> {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { kmInicial: true, kmFinal: true },
  });

  if (!trecho) {
    console.error(`[IGG Calc] Trecho ${trechoId} não encontrado.`);
    return 0;
  }

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  const latestVistoria = await prisma.vistoria.findFirst({
    where: {
      trechoId: trechoId,
      relatorios: {
        some: {
          tipo: 'RFT',
          statusAprovacao: StatusAprovacao.APROVADO,
        },
      },
    },
    orderBy: { dataVistoria: 'desc' },
    select: { id: true },
  });

  if (!latestVistoria) return 0;

  const fotos: FotoComPatologia[] = await prisma.foto.findMany({
    where: {
      vistoriaId: latestVistoria.id,
      tipo: FotoTipo.RFT,
      patologiaId: { not: null },
    },
    include: {
      patologia: {
        select: { id: true, fatorPonderacao: true },
      },
    },
  });

  if (fotos.length === 0) return 0;

  const patologiasAgrupadas = new Map<
    string,
    { fotos: FotoComPatologia[]; fp: number }
  >();

  for (const foto of fotos) {
    if (foto.patologia) {
      const patologiaId = foto.patologia.id;
      if (!patologiasAgrupadas.has(patologiaId)) {
        patologiasAgrupadas.set(patologiaId, {
          fotos: [],
          fp: foto.patologia.fatorPonderacao,
        });
      }
      patologiasAgrupadas.get(patologiaId)!.fotos.push(foto);
    }
  }

  let totalIGG = 0;
  for (const data of patologiasAgrupadas.values()) {
    const fa = data.fotos.length;
    const fp = data.fp;
    const fr = (fa * 100) / n;
    const igi = fr * fp;
    totalIGG += igi;
  }

  return totalIGG;
}

/**
 * Calcula o IGG (Índice de Gravidade Global) para uma VIA inteira.
 */
export async function calculateIGGForVia(viaId: string): Promise<number> {
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: { extensaoKm: true, trechos: { select: { id: true } } },
  });

  if (!via) {
    console.error(`[IGG Calc Via] Via ${viaId} não encontrada.`);
    return 0;
  }

  const metrosTotal = via.extensaoKm * 1000;
  const nViaCalc = Math.floor(metrosTotal / 20);
  const nVia = nViaCalc > 0 ? nViaCalc : 1;

  const patologiaAggregator = new Map<string, { fa: number; fp: number }>();

  for (const trecho of via.trechos) {
    const latestVistoria = await prisma.vistoria.findFirst({
      where: {
        trechoId: trecho.id,
        relatorios: {
          some: { tipo: 'RFT', statusAprovacao: StatusAprovacao.APROVADO },
        },
      },
      orderBy: { dataVistoria: 'desc' },
      select: { id: true },
    });

    if (!latestVistoria) continue;

    const fotos: FotoComPatologia[] = await prisma.foto.findMany({
      where: {
        vistoriaId: latestVistoria.id,
        tipo: FotoTipo.RFT,
        patologiaId: { not: null },
      },
      include: {
        patologia: {
          select: { id: true, fatorPonderacao: true },
        },
      },
    });

    for (const foto of fotos) {
      if (foto.patologia) {
        const pId = foto.patologia.id;
        if (!patologiaAggregator.has(pId)) {
          patologiaAggregator.set(pId, {
            fa: 0,
            fp: foto.patologia.fatorPonderacao,
          });
        }
        patologiaAggregator.get(pId)!.fa += 1;
      }
    }
  }

  let totalIggVia = 0;
  for (const data of patologiaAggregator.values()) {
    const faTotal = data.fa;
    const fp = data.fp;
    const frVia = (faTotal * 100) / nVia;
    const igiVia = frVia * fp;
    totalIggVia += igiVia;
  }

  return totalIggVia;
}

interface IggHistoryPoint {
  data: string;
  igg: number;
}

/**
 * Retorna um array com o IGG de CADA vistoria do trecho,
 * ordenado por data, para criar um gráfico de evolução.
 */
export async function getIggHistoryForTrecho(
  trechoId: string,
): Promise<IggHistoryPoint[]> {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { kmInicial: true, kmFinal: true },
  });

  if (!trecho) return [];

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  const vistorias = await prisma.vistoria.findMany({
    where: { 
      trechoId: trechoId,
      relatorios: {
        some: {
          tipo: 'RFT',
          statusAprovacao: StatusAprovacao.APROVADO
        }
      }
    },
    orderBy: { dataVistoria: 'asc' },
    select: { id: true, dataVistoria: true },
  });

  if (vistorias.length === 0) return [];

  const allFotos: FotoComPatologia[] = await prisma.foto.findMany({
    where: {
      trechoId: trechoId,
      tipo: FotoTipo.RFT,
      patologiaId: { not: null },
    },
    include: {
      patologia: {
        select: { id: true, fatorPonderacao: true },
      },
    },
  });

  const fotosByVistoria = new Map<string, FotoComPatologia[]>();
  for (const foto of allFotos) {
    if (!fotosByVistoria.has(foto.vistoriaId)) {
      fotosByVistoria.set(foto.vistoriaId, []);
    }
    fotosByVistoria.get(foto.vistoriaId)!.push(foto);
  }

  const history: IggHistoryPoint[] = [];

  for (const vistoria of vistorias) {
    const fotosDaVistoria = fotosByVistoria.get(vistoria.id) || [];
    let iggDaVistoria = 0;

    if (fotosDaVistoria.length > 0) {
      const patologiasAgrupadas = new Map<string, { fa: number; fp: number }>();

      for (const foto of fotosDaVistoria) {
        if (foto.patologia) {
          const pId = foto.patologia.id;
          if (!patologiasAgrupadas.has(pId)) {
            patologiasAgrupadas.set(pId, {
              fa: 0,
              fp: foto.patologia.fatorPonderacao,
            });
          }
          patologiasAgrupadas.get(pId)!.fa += 1;
        }
      }

      for (const data of patologiasAgrupadas.values()) {
        const fr = (data.fa * 100) / n;
        const igi = fr * data.fp;
        iggDaVistoria += igi;
      }
    }

    history.push({
      data: new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
      }),
      igg: parseFloat(iggDaVistoria.toFixed(2)),
    });
  }

  return history;
}

export async function getIggDataForVistoria(trechoId: string, vistoriaId: string) {
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { nome: true, kmInicial: true, kmFinal: true, via: { select: { name: true } } }
  });

  if (!trecho) throw new Error("Trecho não encontrado");

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  const fotos = await prisma.foto.findMany({
    where: {
      vistoriaId: vistoriaId,
      tipo: FotoTipo.RFT,
      patologiaId: { not: null },
      vistoria: {
        relatorios: {
          some: {
            tipo: 'RFT',
            statusAprovacao: StatusAprovacao.APROVADO
          }
        }
      }
    },
    include: {
      patologia: true,
      rdsOcorrencia: true
    }
  });

  const patologiasAgrupadas = new Map<string, { patologia: Patologia; fa: number }>();

  for (const foto of fotos) {
    if (foto.patologia) {
      const pId = foto.patologia.id;
      if (!patologiasAgrupadas.has(pId)) {
        patologiasAgrupadas.set(pId, { patologia: foto.patologia, fa: 0 });
      }
      patologiasAgrupadas.get(pId)!.fa += 1;
    }
  }

  let iggTotal = 0;
  const tabelaCalculo = [];
  const tabelaPatologias = [];

  for (const item of patologiasAgrupadas.values()) {
    const fa = item.fa;
    const fr = (fa * 100) / n;
    const fp = item.patologia.fatorPonderacao;
    const igi = fr * fp;
    
    iggTotal += igi;

    tabelaCalculo.push({
      patologia: item.patologia.classificacaoEspecifica,
      fa,
      fr: parseFloat(fr.toFixed(2)),
      fp,
      igi: parseFloat(igi.toFixed(2))
    });

    tabelaPatologias.push({
      nome: item.patologia.classificacaoEspecifica,
      codigo: item.patologia.codigoDnit,
      quantidade: fa
    });
  }

  tabelaCalculo.sort((a, b) => b.igi - a.igi);
  tabelaPatologias.sort((a, b) => b.quantidade - a.quantidade);

  return {
    iggTotal: parseFloat(iggTotal.toFixed(2)),
    nCalculado: n,
    tabelaCalculo,
    tabelaPatologias,
    trecho,
    fotos
  };
}