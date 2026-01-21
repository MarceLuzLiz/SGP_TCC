'use server';

import { PrismaClient, TipoRelatorioVia } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getIggDataForVistoria } from '@/lib/utils/igg';

const prisma = new PrismaClient();

// --- 1. DADOS PARA RFT/RDS INDIVIDUAL ---
export async function getIndividualRelatorioPdfData(relatorioId: string) {
  const relatorio = await prisma.relatorio.findUnique({
    where: { id: relatorioId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
      user: { select: { name: true } },
      approver: { select: { name: true } },
      fotos: {
        include: {
          foto: {
            include: { patologia: true, rdsOcorrencia: true },
          },
        },
      },
    },
  });

  if (!relatorio) throw new Error('Relatório não encontrado');

  const dadosRDS = relatorio.dadosJson ? JSON.parse(relatorio.dadosJson) : {};

  return {
    titulo: relatorio.tipo === 'RFT' ? 'Relatório Fotográfico (RFT)' : 'Relatório Diário de Serviço (RDS)',
    tipo: relatorio.tipo,
    trechoNome: relatorio.trecho.nome,
    viaNome: relatorio.trecho.via.name,
    dataVistoria: relatorio.vistoria.dataVistoria,
    criadoPor: relatorio.user.name,
    aprovadoPor: relatorio.approver?.name || 'Pendente',
    fotos: relatorio.fotos.map((f) => f.foto),
    dadosRDS, // Apenas para RDS
  };
}

// --- 2. DADOS PARA RFT/RDS CONSOLIDADO DA VIA ---
export async function getConsolidadoViaPdfData(relatorioViaId: string) {
  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioViaId },
    include: {
      via: true,
      criadoPor: { select: { name: true } },
      itens: {
        include: {
          relatorioOrigem: {
            include: {
              trecho: true,
              vistoria: true,
              fotos: {
                include: {
                  foto: { include: { patologia: true, rdsOcorrencia: true } },
                },
              },
            },
          },
        },
        orderBy: { relatorioOrigem: { trecho: { kmInicial: 'asc' } } },
      },
    },
  });

  if (!relatorio) throw new Error('Relatório consolidado não encontrado');

  // Transforma os dados para o formato agrupado por trecho
  const trechos = relatorio.itens.map((item) => {
    const jsonRDS = item.relatorioOrigem.dadosJson
      ? JSON.parse(item.relatorioOrigem.dadosJson)
      : {};
    return {
      nome: item.relatorioOrigem.trecho.nome,
      kmInicial: item.relatorioOrigem.trecho.kmInicial,
      kmFinal: item.relatorioOrigem.trecho.kmFinal,
      dataVistoria: item.relatorioOrigem.vistoria.dataVistoria,
      fotos: item.relatorioOrigem.fotos.map((f) => f.foto),
      dadosRDS: jsonRDS,
    };
  });

  return {
    titulo: relatorio.titulo,
    viaNome: relatorio.via.name,
    dataGeracao: relatorio.createdAt,
    criadoPor: relatorio.criadoPor.name,
    trechos,
    tipo: relatorio.tipo, // RFT_VIA ou RDS_VIA
  };
}

// --- 3. DADOS PARA GERENCIAL DA VIA ---
export async function getGerencialViaPdfData(relatorioViaId: string) {
  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioViaId },
    include: {
      criadoPor: { select: { name: true } },
    },
  });

  if (!relatorio || !relatorio.dadosJson) throw new Error('Relatório gerencial inválido');

  const dados = JSON.parse(relatorio.dadosJson);

  // Combina os dados salvos com o metadado do relatório
  return {
    ...dados,
    titulo: relatorio.titulo,
    dataGeracao: relatorio.createdAt,
    criadoPor: relatorio.criadoPor.name,
  };
}

export async function getRelatorioIggTrechoPdfData(trechoId: string, vistoriaId: string) {
  // Busca vistoria para pegar a data e o criador (através do relatório)
  const vistoria = await prisma.vistoria.findUnique({
    where: { id: vistoriaId },
    include: {
      relatorios: {
        where: { tipo: 'RFT', statusAprovacao: 'APROVADO' },
        select: { user: { select: { name: true } } },
        take: 1
      }
    }
  });

  if (!vistoria) throw new Error("Vistoria não encontrada");

  // Realiza o cálculo usando a função do passo 1
  const dadosCalculados = await getIggDataForVistoria(trechoId, vistoriaId);

  // Nome do responsável (pega do primeiro relatório RFT aprovado vinculado à vistoria)
  const responsavel = vistoria.relatorios[0]?.user?.name || "Sistema SGP";

  const kmInicial = dadosCalculados.trecho.kmInicial;
  const kmFinal = dadosCalculados.trecho.kmFinal;

  const extensaoMetros = Math.abs(kmFinal - kmInicial) * 1000;
  const totalEstacas = Math.round(extensaoMetros / 20);

  return {
    titulo: "Relatório de IGG do Trecho",
    viaNome: dadosCalculados.trecho.via.name,
    trechoNome: dadosCalculados.trecho.nome,
    kmInicial: dadosCalculados.trecho.kmInicial,
    kmFinal: dadosCalculados.trecho.kmFinal,
    nCalculado: dadosCalculados.nCalculado,
    totalEstacas: totalEstacas,
    dataVistoria: vistoria.dataVistoria,
    criadoPor: responsavel,
    iggTotal: dadosCalculados.iggTotal,
    tabelaCalculo: dadosCalculados.tabelaCalculo,
    tabelaPatologias: dadosCalculados.tabelaPatologias,
    fotos: dadosCalculados.fotos
  };
}