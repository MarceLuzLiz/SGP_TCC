'use server';

import { PrismaClient, TipoRelatorioVia } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { gerarDadosGerenciais } from '@/lib/utils/gerencial'; // A calculadora
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// Ação 1: APENAS CALCULA (para a pré-visualização)
export async function fetchDadosGerenciaisAction(viaId: string, dataRefStr: string) {
  if (!viaId || !dataRefStr) return { error: 'Dados incompletos.' };
  
  try {
    const dataRef = new Date(dataRefStr);
    const dadosGerenciais = await gerarDadosGerenciais(viaId, dataRef);
    return { success: true, data: dadosGerenciais };
  } catch (error) {
    console.error(error);
    return { error: 'Erro ao gerar os dados.' };
  }
}

// Ação 2: APENAS SALVA (recebe os dados já calculados)
export async function createRelatorioGerencial(
  viaId: string,
  titulo: string,
  dataRefStr: string,
  dadosJson: string, // Recebe os dados prontos
) {
  const session = await getServerSession(authOptions); // 2. Pegar Sessão
  // @ts-expect-error Corrigido
  const userId = session?.user?.id;

  if (!userId) return { error: 'Usuário não autenticado.' };
  if (!viaId || !dataRefStr || !titulo || !dadosJson) {
    return { error: 'Dados incompletos.' };
  }

  try {
    await prisma.relatorioVia.create({
      data: {
        viaId,
        tipo: TipoRelatorioVia.GERENCIAL_VIA,
        titulo,
        dataReferencia: new Date(dataRefStr),
        dadosJson: dadosJson,
        criadorId: userId,
      },
    });

    revalidatePath(`/dashboard-engenheiro/vias/${viaId}/relatorios-via/gerencial`);
    return { success: 'Relatório Gerencial salvo com sucesso!' };
  } catch (error) {
    console.error(error);
    return { error: 'Erro ao salvar o relatório.' };
  }
}

export async function createRelatorioConsolidado(formData: FormData) {
  const session = await getServerSession(authOptions); // 2. Pegar Sessão
  // @ts-expect-error Corrigido
  const userId = session?.user?.id;

  if (!userId) return { error: 'Usuário não autenticado.' };

  const viaId = formData.get('viaId') as string;
  const tipo = formData.get('tipo') as TipoRelatorioVia; // RFT_VIA ou RDS_VIA
  const titulo = formData.get('titulo') as string;
  // ids dos relatórios selecionados (ex: "id1,id2,id3")
  const relatoriosSelecionadosStr = formData.get('relatoriosSelecionados') as string; 

  if (!viaId || !tipo || !relatoriosSelecionadosStr) return { error: 'Selecione os relatórios.' };

  try {
    const relatoriosIds = relatoriosSelecionadosStr.split(',');

    await prisma.relatorioVia.create({
      data: {
        viaId,
        tipo,
        titulo,
        dataReferencia: new Date(),
        criadorId: userId,
        itens: {
          create: relatoriosIds.map(id => ({ relatorioOrigemId: id }))
        }
      }
    });

    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`);
    return { success: 'Relatório consolidado criado!' };
  } catch (error) {
    console.error(error);
    return { error: 'Erro ao criar consolidado.' };
  }
}

export async function deleteRelatorioVia(relatorioViaId: string, viaId: string) {
  if (!relatorioViaId || !viaId) {
    return { error: 'IDs ausentes.' };
  }

  try {
    await prisma.relatorioVia.delete({
      where: { id: relatorioViaId },
    });

    // Revalida todas as páginas de listagem
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft`);
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds`);
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}/relatorios-via/gerencial`);
    
    return { success: 'Relatório da via excluído com sucesso.' };
  } catch (error) {
    console.error(error);
    return { error: 'Falha ao excluir o relatório.' };
  }
}