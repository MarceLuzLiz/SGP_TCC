import { PrismaClient, FotoTipo, Foto, StatusAprovacao, Patologia} from '@prisma/client';

const prisma = new PrismaClient();

// --- TIPO CORRETO ---
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

  // Calcula quantas estacas de 20m cabem até o ponto final e subtrai as que cabiam até o inicial
  const n = Math.floor(metrosFinal / 20) - Math.floor(metrosInicial / 20);

  // Evita divisão por zero caso o trecho seja muito pequeno ou haja erro de cadastro
  return n > 0 ? n : 1;
}
/**
 * Calcula o IGG (Índice de Gravidade Global) para um Trecho específico,
 * baseado na sua Vistoria mais recente, conforme as regras de negócio:
 */
export async function calculateIGGForTrecho(trechoId: string): Promise<number> {
  // 1. Buscar o Trecho para calcular 'n' (estacas)
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { kmInicial: true, kmFinal: true },
  });

  if (!trecho) {
    console.error(`[IGG Calc] Trecho ${trechoId} não encontrado.`);
    return 0;
  }

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  // 2. Encontrar a Vistoria mais recente
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

  // 3. Buscar as fotos RFT desta vistoria
  const fotos: FotoComPatologia[] = await prisma.foto.findMany({ // Usa o tipo
    where: {
      vistoriaId: latestVistoria.id,
      tipo: FotoTipo.RFT,
      patologiaId: { not: null },
    },
    include: {
      patologia: {
        select: { id: true, fatorPonderacao: true, classificacaoEspecifica: true },
      },
    },
  });

  if (fotos.length === 0) return 0;

  // 4. Agrupar fotos por tipo de patologia
  const patologiasAgrupadas = new Map<
    string,
    { fotos: FotoComPatologia[]; fp: number } // <-- 2. USAR O TIPO CORRETO AQUI
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

  // 5. Calcular Σ(IGI)
  let totalIGG = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [_patologiaId, data] of patologiasAgrupadas.entries()) {
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
  // 1. Buscar a Via para calcular 'n_Via'
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

  // 2. Agregador global de 'Σfa' e 'fp'
  const patologiaAggregator = new Map<string, { fa: number; fp: number }>();

  // 3. Iterar sobre CADA trecho da via
  for (const trecho of via.trechos) {
    // 3a. Encontrar a vistoria mais recente DESTE trecho
    const latestVistoria = await prisma.vistoria.findFirst({
      where: {
        trechoId: trecho.id,
        relatorios: {
          some: { tipo: 'RFT', statusAprovacao: StatusAprovacao.APROVADO }, // <-- FILTRO
        },
      },
      orderBy: { dataVistoria: 'desc' },
      select: { id: true },
    });

    if (!latestVistoria) continue;

    // 3b. Buscar as fotos RFT desta vistoria
    const fotos: FotoComPatologia[] = await prisma.foto.findMany({ // Usa o tipo
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

    // 3c. Adicionar as contagens ao agregador global (Σfa)
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

  // 4. Calcular o IGG da Via (Σ(IGI_Via))
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

// --- 3. TIPO CORRETO PARA O HISTÓRICO ---
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
  // 1. Buscar o Trecho para calcular 'n' (estacas)
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { kmInicial: true, kmFinal: true },
  });

  if (!trecho) return [];

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  // 2. Buscar TODAS as vistorias do trecho, ordenadas
  const vistorias = await prisma.vistoria.findMany({
    where: { 
      trechoId: trechoId,
      // --- FILTRO ADICIONADO ---
      relatorios: {
        some: {
          tipo: 'RFT',
          statusAprovacao: StatusAprovacao.APROVADO
        }
      }
      // -------------------------
    },
    orderBy: { dataVistoria: 'asc' },
    select: { id: true, dataVistoria: true },
  });

  if (vistorias.length === 0) return [];

  // 3. Buscar TODAS as fotos RFT do trecho de uma só vez
  const allFotos: FotoComPatologia[] = await prisma.foto.findMany({ // Usa o tipo
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

  // 4. Agrupar fotos por 'vistoriaId' para processamento rápido
  // --- 4. CORREÇÃO PRINCIPAL AQUI ---
  const fotosByVistoria = new Map<string, FotoComPatologia[]>();
  for (const foto of allFotos) {
    if (!fotosByVistoria.has(foto.vistoriaId)) {
      fotosByVistoria.set(foto.vistoriaId, []);
    }
    fotosByVistoria.get(foto.vistoriaId)!.push(foto);
  }

  // 5. Calcular o IGG para cada vistoria
  const history: IggHistoryPoint[] = [];

  for (const vistoria of vistorias) {
    // Agora 'fotosDaVistoria' é do tipo 'FotoComPatologia[]'
    const fotosDaVistoria = fotosByVistoria.get(vistoria.id) || [];
    let iggDaVistoria = 0;

    if (fotosDaVistoria.length > 0) {
      const patologiasAgrupadas = new Map<string, { fa: number; fp: number }>();

      // E 'foto' é do tipo 'FotoComPatologia', então 'foto.patologia' existe
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
  // 1. Dados do Trecho (para calcular 'n')
  const trecho = await prisma.trecho.findUnique({
    where: { id: trechoId },
    select: { nome: true, kmInicial: true, kmFinal: true, via: { select: { name: true } } }
  });

  if (!trecho) throw new Error("Trecho não encontrado");

  const n = calcularNumeroEstacoes(trecho.kmInicial, trecho.kmFinal);

  // 2. Buscar fotos RFT desta vistoria específica
  const fotos = await prisma.foto.findMany({
    where: {
      vistoriaId: vistoriaId,
      tipo: FotoTipo.RFT,
      patologiaId: { not: null },
      
      // --- CORREÇÃO AQUI ---
      // Acessamos os relatórios através da relação 'vistoria'
      vistoria: {
        relatorios: {
          some: {
            tipo: 'RFT',
            statusAprovacao: StatusAprovacao.APROVADO
          }
        }
      }
      // ---------------------
    },
    include: {
      patologia: true,
      rdsOcorrencia: true
    }
  });

  // 3. Cálculo do IGG
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

  // Ordenar tabelas
  tabelaCalculo.sort((a, b) => b.igi - a.igi);
  tabelaPatologias.sort((a, b) => b.quantidade - a.quantidade);

  return {
    iggTotal: parseFloat(iggTotal.toFixed(2)),
    nCalculado: n,
    tabelaCalculo,
    tabelaPatologias,
    trecho,
    fotos // Retorna as fotos para o PDF
  };
}