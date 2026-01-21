import { PrismaClient, FotoTipo, StatusAprovacao, Foto, Patologia, RdsOcorrencia } from '@prisma/client';

const prisma = new PrismaClient();

type FotoCompleta = Foto & { patologia: Patologia | null; rdsOcorrencia: RdsOcorrencia | null };

interface DadosGerenciais {
  iggTotal: number;
  tabelaPatologias: {
    nome: string;
    codigo: string;
    quantidade: number;
    trechosAfetados: number;
  }[];
  tabelaCalculo: {
    patologia: string;
    fa: number; // Frequência Absoluta
    fr: number; // Frequência Relativa
    fp: number; // Fator de Ponderação
    igi: number; // Índice de Gravidade Individual
  }[];
  viaName: string;
  totalTrechos: number;
  viaEstacas: string | null;
  extensaoKm: number;
  totalPatologias: number;
  fotosPorTrecho: {
    trechoNome: string;
    kmInicial: number;
    kmFinal: number;
    dataVistoria: Date;
    fotos: FotoCompleta[];
  }[];
  totalEstacoesConsideradas: number;
}

export async function gerarDadosGerenciais(viaId: string, dataRef: Date): Promise<DadosGerenciais> {
  // 1. Busca a Via e seus Trechos
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: {
      extensaoKm: true,
      name: true,
      estacas: true,
      trechos: { 
        select: { id: true, nome: true, kmInicial: true, kmFinal: true },
        orderBy: { kmInicial: 'asc' } 
      }
    },
  });

  if (!via) throw new Error('Via não encontrada');

  const extensaoM = via.extensaoKm * 1000;
  // Math.floor garante que os metros "sobrantes" no final da via não criem uma estaca extra fracionada
  let nVia = Math.floor(extensaoM / 20);
  if (nVia <= 0) nVia = 1;

  // 2. Agregador Global
  // Chave: Patologia ID -> Valor: { dados da patologia, contagem, trechos }
  const agregador = new Map<string, { 
    patologia: { nome: string; codigo: string; fp: number };
    fa: number;
    trechosIds: Set<string>;
  }>();

  const fotosPorTrecho = [];

  // 3. Iterar Trechos e Buscar Fotos Próximas à Data
  for (const trecho of via.trechos) {
    // 1. Busca vistoria mais próxima QUE TENHA RFT APROVADO
    const vistorias = await prisma.vistoria.findMany({
      where: {
        trechoId: trecho.id,
        relatorios: { some: { tipo: 'RFT', statusAprovacao: StatusAprovacao.APROVADO } } // <-- FILTRO
      },
      select: { id: true, dataVistoria: true }
    });

    // Lógica de "mais próxima da data" em memória (JavaScript)
    let vistoriaAlvo = null;
    let menorDif = Infinity;

    for (const v of vistorias) {
      const dif = Math.abs(v.dataVistoria.getTime() - dataRef.getTime());
      if (dif < menorDif) {
        menorDif = dif;
        vistoriaAlvo = v;
      }
    }

    if (!vistoriaAlvo) continue;

    // Busca fotos dessa vistoria
    const fotos = await prisma.foto.findMany({
      where: { vistoriaId: vistoriaAlvo.id, tipo: FotoTipo.RFT, patologiaId: { not: null } },
      include: { patologia: true, rdsOcorrencia: true }, // Inclui tudo para o PDF
    });

    if (fotos.length > 0) {
        // Salva para o PDF
        fotosPorTrecho.push({
            trechoNome: trecho.nome,
            kmInicial: trecho.kmInicial,
            kmFinal: trecho.kmFinal,
            dataVistoria: vistoriaAlvo.dataVistoria,
            fotos: fotos
        });

        // Agrega para o cálculo
        for (const foto of fotos) {
            if (foto.patologia) {
                const pId = foto.patologia.id;
                if (!agregador.has(pId)) {
                agregador.set(pId, {
                    patologia: { nome: foto.patologia.classificacaoEspecifica, codigo: foto.patologia.codigoDnit, fp: foto.patologia.fatorPonderacao },
                    fa: 0,
                    trechosIds: new Set(),
                });
                }
                const entry = agregador.get(pId)!;
                entry.fa += 1;
                entry.trechosIds.add(trecho.id);
            }
        }
    }
  }

  // 4. Montar as Tabelas e Calcular IGG Final
  const tabelaPatologias = [];
  const tabelaCalculo = [];
  let iggTotal = 0;
  let totalPatologias = 0;

  for (const item of agregador.values()) {
    // Tabela 1: Quantitativo Simples
    tabelaPatologias.push({
      nome: item.patologia.nome,
      codigo: item.patologia.codigo,
      quantidade: item.fa,
      trechosAfetados: item.trechosIds.size,
    });

    totalPatologias += item.fa;

    // Cálculo IGG
    const fr = (item.fa * 100) / nVia;
    const igi = fr * item.patologia.fp;
    iggTotal += igi;

    // Tabela 2: Memória de Cálculo
    tabelaCalculo.push({
      patologia: item.patologia.nome,
      fa: item.fa,
      fr: parseFloat(fr.toFixed(2)),
      fp: item.patologia.fp,
      igi: parseFloat(igi.toFixed(2)),
    });
  }

  // Ordenar tabelas para melhor visualização
  tabelaPatologias.sort((a, b) => b.quantidade - a.quantidade);
  tabelaCalculo.sort((a, b) => b.igi - a.igi);

  return {
    iggTotal,
    tabelaPatologias,
    tabelaCalculo,
    viaName: via.name,
    totalTrechos: via.trechos.length,
    viaEstacas: via.estacas,
    extensaoKm: via.extensaoKm,
    totalPatologias: totalPatologias,
    fotosPorTrecho,
    totalEstacoesConsideradas: nVia,
  };
}