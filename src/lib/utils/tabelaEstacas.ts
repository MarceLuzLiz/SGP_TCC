import { parseEstacaToNumber } from './photoOrder';

export interface DefeitoDnitDef {
  codigo: string;
  tipo: number;
  fp: number;
  nome: string;
  grupo: 'TRINCAS' | 'AFUNDAMENTOS' | 'OUTROS DEFEITOS';
  subgrupo: 'ISOLADAS' | 'FC-2' | 'FC-3' | 'PLÁSTICO' | 'CONSOLIDAÇÃO' | 'OUTROS';
}

export const DEFEITOS_DNIT: DefeitoDnitDef[] = [
  // TRINCAS -> ISOLADAS (Tipo 1)
  { codigo: 'FI', tipo: 1, fp: 0.2, nome: 'Fissuras', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },
  { codigo: 'TTC', tipo: 1, fp: 0.2, nome: 'Trinca Isolada Transversal Curta', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },
  { codigo: 'TTL', tipo: 1, fp: 0.2, nome: 'Trinca Isolada Transversal Longa', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },
  { codigo: 'TLC', tipo: 1, fp: 0.2, nome: 'Trinca Isolada Longitudinal Curta', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },
  { codigo: 'TLL', tipo: 1, fp: 0.2, nome: 'Trinca Isolada Longitudinal Longa', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },
  { codigo: 'TRR', tipo: 1, fp: 0.2, nome: 'Trinca Isolada por Retração Térmica', grupo: 'TRINCAS', subgrupo: 'ISOLADAS' },

  // TRINCAS -> FC-2 (Tipo 2)
  { codigo: 'J', tipo: 2, fp: 0.5, nome: 'Trinca Interligada "Jacaré" (sem erosão acentuada)', grupo: 'TRINCAS', subgrupo: 'FC-2' },
  { codigo: 'TB', tipo: 2, fp: 0.5, nome: 'Trinca Interligada "Jacaré" (com erosão acentuada)', grupo: 'TRINCAS', subgrupo: 'FC-2' },

  // TRINCAS -> FC-3 (Tipo 3)
  { codigo: 'JE', tipo: 3, fp: 0.8, nome: 'Trinca Interligada "Bloco" (sem erosão acentuada)', grupo: 'TRINCAS', subgrupo: 'FC-3' },
  { codigo: 'TBE', tipo: 3, fp: 0.8, nome: 'Trinca Interligada "Bloco" (com erosão acentuada)', grupo: 'TRINCAS', subgrupo: 'FC-3' },

  // AFUNDAMENTOS -> PLÁSTICO (Tipo 4)
  { codigo: 'ALP', tipo: 4, fp: 0.9, nome: 'Afundamento Plástico Local', grupo: 'AFUNDAMENTOS', subgrupo: 'PLÁSTICO' },
  { codigo: 'ATP', tipo: 4, fp: 0.9, nome: 'Afundamento Plástico na Trilha de Roda', grupo: 'AFUNDAMENTOS', subgrupo: 'PLÁSTICO' },

  // AFUNDAMENTOS -> CONSOLIDAÇÃO (Tipo 4)
  { codigo: 'ALC', tipo: 4, fp: 0.9, nome: 'Afundamento por Consolidação Local', grupo: 'AFUNDAMENTOS', subgrupo: 'CONSOLIDAÇÃO' },
  { codigo: 'ATC', tipo: 4, fp: 0.9, nome: 'Afundamento por Consolidação na Trilha de Roda', grupo: 'AFUNDAMENTOS', subgrupo: 'CONSOLIDAÇÃO' },

  // OUTROS DEFEITOS (Tipo 5, 6, 7, 8)
  { codigo: 'O', tipo: 5, fp: 1.0, nome: 'Ondulação ou Corrugação', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
  { codigo: 'P', tipo: 5, fp: 1.0, nome: '"Panelas" ou buracos', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
  { codigo: 'E', tipo: 5, fp: 1.0, nome: 'Escorregamento do revestimento', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
  { codigo: 'EX', tipo: 6, fp: 0.5, nome: 'Exsudação do ligante', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
  { codigo: 'D', tipo: 7, fp: 0.3, nome: 'Desgaste acentuado na superfície', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
  { codigo: 'R', tipo: 8, fp: 0.6, nome: 'Remendos (Superficiais ou Profundos)', grupo: 'OUTROS DEFEITOS', subgrupo: 'OUTROS' },
];

export const MAPA_DEFEITOS = new Map<string, DefeitoDnitDef>(
  DEFEITOS_DNIT.map((d) => [d.codigo.toUpperCase(), d])
);

export interface LinhaEstaca {
  numero: number;
  label: string; // Ex: "Est. 1"
  secaoTerrap: string; // Ex: "A"
  ok: boolean; // true se nenhum defeito na estaca
  defeitos: Record<string, boolean>; // Ex: { D: true, R: true }
  totalDefeitos: number;
}

export interface TotaisDefeitosEstaca {
  totaisPorCodigo: Record<string, number>;
  totalEstacasComDefeito: number;
  totalEstacasOk: number;
  totalOcorrencias: number;
}

export interface ResultadoTabelaEstacas {
  linhas: LinhaEstaca[];
  totais: TotaisDefeitosEstaca;
}

interface ItemFotoEntrada {
  estaca?: string | null;
  patologia?: {
    codigoDnit?: string | null;
  } | null;
}

interface TrechoEntrada {
  trechoNome?: string;
  kmInicial?: number;
  kmFinal?: number;
  fotos: ItemFotoEntrada[];
}

/**
 * Extrai a letra ou identificador simples de seção de terraplenagem a partir do nome do trecho.
 * Ex: "Trecho A", "A", "Trecho 1" -> "A" ou "1". Padrão: "A".
 */
export function extrairSecaoTerrap(nomeTrecho?: string | null): string {
  if (!nomeTrecho) return 'A';
  const clean = nomeTrecho.trim();
  // Se contiver Trecho A / Trecho B / Pista A
  const match = clean.match(/(?:trecho|pista|seção|secao)\s*([A-Za-z0-9])/i);
  if (match) return match[1].toUpperCase();

  // Letra isolada no início ou fim
  const matchSingle = clean.match(/\b([A-Za-z])\b/);
  if (matchSingle) return matchSingle[1].toUpperCase();

  return 'A';
}

/**
 * Gera a matriz/tabela de patologias por estaca no padrão da planilha oficial do DNIT.
 */
export function gerarTabelaEstacas(
  totalEstacoes: number,
  fotosPorTrecho: TrechoEntrada[]
): ResultadoTabelaEstacas {
  // 1. Determina os limites de estaca (min e max)
  let minEstaca = 1;
  let maxEstaca = Math.max(1, totalEstacoes || 1);

  for (const trecho of fotosPorTrecho) {
    for (const foto of trecho.fotos || []) {
      if (foto.estaca) {
        const parsed = parseEstacaToNumber(foto.estaca);
        if (parsed !== Infinity && !isNaN(parsed)) {
          const num = Math.floor(parsed);
          if (num < minEstaca) minEstaca = num;
          if (num > maxEstaca) maxEstaca = num;
        }
      }
    }
  }

  // 2. Inicializa as linhas de estaca
  const linhasMap = new Map<number, LinhaEstaca>();
  for (let i = minEstaca; i <= maxEstaca; i++) {
    // Determina a seção para a estaca 'i'
    let secao = 'A';
    if (fotosPorTrecho.length > 0) {
      const kmEstaca = ((i - 0.5) * 20) / 1000;
      const matchingTrecho = fotosPorTrecho.find(
        (t) =>
          typeof t.kmInicial === 'number' &&
          typeof t.kmFinal === 'number' &&
          kmEstaca >= t.kmInicial &&
          kmEstaca <= t.kmFinal
      );
      if (matchingTrecho) {
        secao = extrairSecaoTerrap(matchingTrecho.trechoNome);
      } else {
        secao = extrairSecaoTerrap(fotosPorTrecho[0].trechoNome);
      }
    }

    const defeitosObj: Record<string, boolean> = {};
    DEFEITOS_DNIT.forEach((d) => {
      defeitosObj[d.codigo] = false;
    });

    linhasMap.set(i, {
      numero: i,
      label: `Est. ${i}`,
      secaoTerrap: secao,
      ok: true,
      defeitos: defeitosObj,
      totalDefeitos: 0,
    });
  }

  // 3. Preenche as ocorrências de patologias nas estacas correspondentes
  for (const trecho of fotosPorTrecho) {
    for (const foto of trecho.fotos || []) {
      const codigo = foto.patologia?.codigoDnit?.trim().toUpperCase();
      if (!codigo || !MAPA_DEFEITOS.has(codigo)) continue;

      let estacaNum: number | null = null;
      if (foto.estaca) {
        const parsed = parseEstacaToNumber(foto.estaca);
        if (parsed !== Infinity && !isNaN(parsed)) {
          estacaNum = Math.floor(parsed);
        }
      }

      if (estacaNum !== null && linhasMap.has(estacaNum)) {
        const linha = linhasMap.get(estacaNum)!;
        if (!linha.defeitos[codigo]) {
          linha.defeitos[codigo] = true;
          linha.totalDefeitos += 1;
          linha.ok = false;
        }
      }
    }
  }

  const linhas = Array.from(linhasMap.values()).sort((a, b) => a.numero - b.numero);

  // 4. Calcula totais para o rodapé da tabela (Fa por código)
  const totaisPorCodigo: Record<string, number> = {};
  DEFEITOS_DNIT.forEach((d) => {
    totaisPorCodigo[d.codigo] = 0;
  });

  let totalEstacasComDefeito = 0;
  let totalEstacasOk = 0;
  let totalOcorrencias = 0;

  for (const linha of linhas) {
    if (linha.ok) {
      totalEstacasOk++;
    } else {
      totalEstacasComDefeito++;
    }

    for (const def of DEFEITOS_DNIT) {
      if (linha.defeitos[def.codigo]) {
        totaisPorCodigo[def.codigo]++;
        totalOcorrencias++;
      }
    }
  }

  return {
    linhas,
    totais: {
      totaisPorCodigo,
      totalEstacasComDefeito,
      totalEstacasOk,
      totalOcorrencias,
    },
  };
}
