'use server';

import { PrismaClient, RelatorioTipo, StatusAprovacao } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

const prisma = new PrismaClient();

interface ActionResult {
  success?: string;
  error?: string;
}

export async function createRFT(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado.' };
  }

  const trechoId = formData.get('trechoId') as string;
  const vistoriaId = formData.get('vistoriaId') as string;
  const fotoIds = formData.getAll('fotoIds') as string[];

  const existingRFT = await prisma.relatorio.findFirst({
    where: {
      vistoriaId: vistoriaId,
      tipo: RelatorioTipo.RFT,
    },
  });

  if (existingRFT) {
    return { error: 'Já existe um Relatório Fotográfico (RFT) para esta vistoria.' };
  }

  if (!trechoId || !vistoriaId || fotoIds.length === 0) {
    return { error: 'É necessário selecionar uma vistoria e ao menos uma foto.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const newRelatorio = await tx.relatorio.create({
        data: {
          tipo: RelatorioTipo.RFT,
          trechoId: trechoId,
          vistoriaId: vistoriaId,
          // @ts-expect-error Corrigido
          userId: session.user.id,
        },
      });

      const relatorioFotoData = fotoIds.map((fotoId) => ({
        relatorioId: newRelatorio.id,
        fotoId: fotoId,
      }));

      await tx.relatorioFoto.createMany({
        data: relatorioFotoData,
      });
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/rft`);
    return { success: 'RFT criado com sucesso!' };

  } catch (error) {
    console.error('Falha ao criar RFT:', error);
    return { error: 'Ocorreu um erro no servidor ao criar o relatório.' };
  }
}

export async function createRDS(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado.' };
  }

  const trechoId = formData.get('trechoId') as string;
  const vistoriaId = formData.get('vistoriaId') as string;
  const fotoIds = formData.getAll('fotoIds') as string[];

  const dadosRDS = {
    clima: formData.get('clima') as string,
    horarioEntrada: formData.get('horarioEntrada') as string,
    horarioSaida: formData.get('horarioSaida') as string,
    anotacoes: formData.get('anotacoes') as string,
    ocorrencias: formData.get('ocorrencias') as string,
  };

  const existingRDS = await prisma.relatorio.findFirst({
    where: {
      vistoriaId: vistoriaId,
      tipo: RelatorioTipo.RDS,
    },
  });

  if (existingRDS) {
    return { error: 'Já existe um Relatório Diário de Serviço (RDS) para esta vistoria.' };
  }

  if (!trechoId || !vistoriaId) {
    return { error: 'É necessário selecionar uma vistoria.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const newRelatorio = await tx.relatorio.create({
        data: {
          tipo: RelatorioTipo.RDS,
          trechoId: trechoId,
          vistoriaId: vistoriaId,
          // @ts-expect-error Corrigido
          userId: session.user.id,
          dadosJson: JSON.stringify(dadosRDS),
        },
      });

      if (fotoIds.length > 0) {
        const relatorioFotoData = fotoIds.map((fotoId) => ({
          relatorioId: newRelatorio.id,
          fotoId: fotoId,
        }));
        await tx.relatorioFoto.createMany({
          data: relatorioFotoData,
        });
      }
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/rds`);
    return { success: 'RDS criado com sucesso!' };

  } catch (error) {
    console.error('Falha ao criar RDS:', error);
    return { error: 'Ocorreu um erro no servidor ao criar o relatório.' };
  }
}

export async function deleteRelatorio(
  relatorioId: string, 
  trechoId: string, 
  tipo: 'RFT' | 'RDS'
): Promise<ActionResult> {
  if (!relatorioId || !trechoId) {
    return { error: 'IDs do relatório e do trecho são necessários.' };
  }

  try {
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      return { error: 'Relatório não encontrado.' };
    }

    // CORREÇÃO: Usando o Enum importado
    if (relatorio.statusAprovacao !== StatusAprovacao.PENDENTE && relatorio.statusAprovacao !== StatusAprovacao.REPROVADO) {
      return { error: `Não é possível excluir. O relatório já foi ${relatorio.statusAprovacao.toLowerCase()}.` };
    }

    await prisma.relatorio.delete({
      where: { id: relatorioId },
    });

    const path = tipo === 'RFT' ? `/dashboard/trechos/${trechoId}/rft` : `/dashboard/trechos/${trechoId}/rds`;
    revalidatePath(path);

    return { success: 'Relatório excluído com sucesso!' };

  } catch (error) {
    console.error(`Falha ao excluir ${tipo}:`, error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

export async function updateRFT(formData: FormData): Promise<ActionResult> {
  const relatorioId = formData.get('relatorioId') as string;
  const trechoId = formData.get('trechoId') as string;
  const fotoIds = formData.getAll('fotoIds') as string[];

  if (!relatorioId || !trechoId || fotoIds.length === 0) {
    return { error: 'É necessário selecionar ao menos uma foto.' };
  }

  try {
    const relatorioAtual = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorioAtual) {
      return { error: 'Relatório não encontrado.' };
    }

    // CORREÇÃO: Usando o Enum
    if (relatorioAtual.statusAprovacao !== StatusAprovacao.PENDENTE && relatorioAtual.statusAprovacao !== StatusAprovacao.REPROVADO) {
      return { error: 'Este relatório não pode ser editado pois seu status não é "Pendente".' };
    }

    // CORREÇÃO: Tipagem forte
    const novosDados: { statusAprovacao?: StatusAprovacao } = {};
    if (relatorioAtual.statusAprovacao === StatusAprovacao.REPROVADO) {
      novosDados.statusAprovacao = StatusAprovacao.CORRIGIDO;
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(novosDados).length > 0) {
        await tx.relatorio.update({ where: { id: relatorioId }, data: novosDados });
      }

      await tx.relatorioFoto.deleteMany({
        where: { relatorioId: relatorioId },
      });

      const novosVinculos = fotoIds.map((fotoId) => ({
        relatorioId: relatorioId,
        fotoId: fotoId,
      }));

      await tx.relatorioFoto.createMany({
        data: novosVinculos,
      });
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/rft`);
    revalidatePath(`/dashboard/trechos/${trechoId}/rft/${relatorioId}`);

    return { success: 'RFT atualizado com sucesso!' };

  } catch (error) {
    console.error('Falha ao atualizar RFT:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

export async function updateRDS(formData: FormData): Promise<ActionResult> {
  const relatorioId = formData.get('relatorioId') as string;
  const trechoId = formData.get('trechoId') as string;
  const fotoIds = formData.getAll('fotoIds') as string[];

  const dadosRDS = {
    clima: formData.get('clima') as string,
    horarioEntrada: formData.get('horarioEntrada') as string,
    horarioSaida: formData.get('horarioSaida') as string,
    anotacoes: formData.get('anotacoes') as string,
    ocorrencias: formData.get('ocorrencias') as string,
  };

  if (!relatorioId || !trechoId) {
    return { error: 'ID do relatório é necessário.' };
  }

  try {
    const relatorioAtual = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorioAtual) {
      return { error: 'Relatório não encontrado.' };
    }

    // CORREÇÃO: Usando o Enum
    if (relatorioAtual.statusAprovacao !== StatusAprovacao.PENDENTE && relatorioAtual.statusAprovacao !== StatusAprovacao.REPROVADO) {
      return { error: 'Este relatório não pode ser editado.' };
    }

    // CORREÇÃO: Tipagem forte
    const novosDadosRelatorio: {
      dadosJson: string;
      statusAprovacao?: StatusAprovacao;
    } = {
      dadosJson: JSON.stringify(dadosRDS),
    };
    if (relatorioAtual.statusAprovacao === StatusAprovacao.REPROVADO) {
      novosDadosRelatorio.statusAprovacao = StatusAprovacao.CORRIGIDO;
    }

    await prisma.$transaction(async (tx) => {
      await tx.relatorio.update({
        where: { id: relatorioId },
        data: novosDadosRelatorio,
      });

      await tx.relatorioFoto.deleteMany({
        where: { relatorioId: relatorioId },
      });

      if (fotoIds.length > 0) {
        const novosVinculos = fotoIds.map((fotoId) => ({
          relatorioId: relatorioId,
          fotoId: fotoId,
        }));
        await tx.relatorioFoto.createMany({
          data: novosVinculos,
        });
      }
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/rds`);
    revalidatePath(`/dashboard/trechos/${trechoId}/rds/${relatorioId}`);

    return { success: 'RDS atualizado com sucesso!' };

  } catch (error) {
    console.error('Falha ao atualizar RDS:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

// --- NOVAS FUNÇÕES DO MÓDULO ENGENHEIRO ---

interface ApprovalResult {
  success?: string;
  error?: string;
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Aprova um relatório (RFT ou RDS).
 */
export async function approveRelatorio(
  relatorioId: string,
  trechoId: string,
): Promise<ApprovalResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  if (!relatorioId || !trechoId) {
    return { error: 'IDs do relatório e do trecho são necessários.' };
  }

  try {
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      return { error: 'Relatório não encontrado.' };
    }

    // 2. Regra de Negócio: Só pode aprovar o que está PENDENTE ou CORRIGIDO
    if (
      relatorio.statusAprovacao !== StatusAprovacao.PENDENTE &&
      relatorio.statusAprovacao !== StatusAprovacao.CORRIGIDO
    ) {
      return { error: `Este relatório (status: ${relatorio.statusAprovacao}) não pode ser aprovado.` };
    }

    // 3. Atualização
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        statusAprovacao: StatusAprovacao.APROVADO,
        motivoReprovacao: null,
        // @ts-expect-error Corrigido
        approverId: session.user.id,
      },
    });

    // 4. Revalidação de cache
    const path = relatorio.tipo === RelatorioTipo.RFT ? 'rft' : 'rds';
    revalidatePath(`/dashboard/trechos/${trechoId}/${path}`); // Revalida a lista do fiscal
    revalidatePath(`/dashboard-engenheiro/aprovacoes`); // Revalida a fila do engenheiro (rota futura)
    revalidatePath(`/dashboard-engenheiro/vias/${relatorio.trechoId}`); // Revalida os detalhes do trecho

    return { success: 'Relatório aprovado com sucesso!' };
  } catch (error) {
    console.error('Falha ao aprovar relatório:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Reprova um relatório (RFT ou RDS), exigindo um motivo.
 */
export async function reproveRelatorio(
  formData: FormData,
): Promise<ApprovalResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  const relatorioId = formData.get('relatorioId') as string;
  const trechoId = formData.get('trechoId') as string;
  const motivoReprovacao = formData.get('motivoReprovacao') as string;

  if (!relatorioId || !trechoId) {
    return { error: 'IDs do relatório e do trecho são necessários.' };
  }
  if (!motivoReprovacao || motivoReprovacao.trim().length < 5) {
    return { error: 'Um motivo com pelo menos 5 caracteres é obrigatório para reprovar.' };
  }

  try {
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      return { error: 'Relatório não encontrado.' };
    }

    // 2. Regra de Negócio: Não pode reprovar algo que já está APROVADO
    if (relatorio.statusAprovacao === StatusAprovacao.APROVADO) {
      return { error: 'Não é possível reprovar um relatório que já foi aprovado.' };
    }

    // 3. Atualização
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        statusAprovacao: StatusAprovacao.REPROVADO,
        motivoReprovacao: motivoReprovacao.trim(),
      },
    });

    // 4. Revalidação de cache
    const path = relatorio.tipo === RelatorioTipo.RFT ? 'rft' : 'rds';
    revalidatePath(`/dashboard/trechos/${trechoId}/${path}`); // Revalida a lista do fiscal
    revalidatePath(`/dashboard-engenheiro/aprovacoes`); // Revalida a fila do engenheiro (rota futura)
    revalidatePath(`/dashboard-engenheiro/vias/${relatorio.trechoId}`); // Revalida os detalhes do trecho

    return { success: 'Relatório reprovado com sucesso.' };
  } catch (error) {
    console.error('Falha ao reprovar relatório:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

export async function requestCancellation(
  formData: FormData,
): Promise<ApprovalResult> { // Reutilizando o tipo ApprovalResult
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão (Engenheiro ou Admin podem solicitar)
  // @ts-expect-error Corrigido
  const userRole = session?.user?.role;
  if (userRole !== Role.ENGENHEIRO && userRole !== Role.ADMIN) {
    return { error: 'Acesso negado.' };
  }

  const relatorioId = formData.get('relatorioId') as string;
  const motivoCancelamento = formData.get('motivoCancelamento') as string;

  if (!relatorioId) {
    return { error: 'ID do relatório é necessário.' };
  }
  if (!motivoCancelamento || motivoCancelamento.trim().length < 10) {
    return { error: 'Um motivo com pelo menos 10 caracteres é obrigatório.' };
  }

  try {
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio) {
      return { error: 'Relatório não encontrado.' };
    }

    // 2. Regra de Negócio: Só pode solicitar cancelamento do que está APROVADO
    if (relatorio.statusAprovacao !== StatusAprovacao.APROVADO) {
      return { error: 'Só é possível solicitar cancelamento de relatórios APROVADOS.' };
    }

    // 3. Atualização
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        statusAprovacao: StatusAprovacao.CANCELAMENTO_PENDENTE,
        motivoCancelamento: motivoCancelamento.trim(),
      },
    });

    // 4. Revalidação de cache
    revalidatePath('/dashboard-engenheiro/aprovacoes'); // Revalida a fila do engenheiro
    revalidatePath('/dashboard-admin/cancelamentos'); // Revalida a futura fila do admin

    return { success: 'Solicitação de cancelamento enviada com sucesso!' };
  } catch (error) {
    console.error('Falha ao solicitar cancelamento:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Aprova uma solicitação de cancelamento.
 * O relatório volta para o estado REPROVADO (para o fiscal corrigir).
 */
export async function approveCancellation(
  relatorioId: string,
): Promise<ApprovalResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão (APENAS ADMIN)
  // @ts-expect-error Corrigido
  if (session?.user?.role !== Role.ADMIN) {
    return { error: 'Acesso negado. Requer permissão de Administrador.' };
  }

  try {
    const relatorio = await prisma.relatorio.findUnique({
      where: { id: relatorioId },
    });

    if (!relatorio || relatorio.statusAprovacao !== StatusAprovacao.CANCELAMENTO_PENDENTE) {
      return { error: 'Este relatório não está pendente de cancelamento.' };
    }

    // 2. Atualização: Volta para REPROVADO e move o motivo
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        statusAprovacao: StatusAprovacao.REPROVADO,
        motivoReprovacao: `Cancelamento Aprovado: "${relatorio.motivoCancelamento}"`, // Move o motivo
        motivoCancelamento: null, // Limpa o motivo do cancelamento
      },
    });

    revalidatePath('/dashboard-engenheiro/aprovacoes');
    revalidatePath('/dashboard-admin/cancelamentos');
    revalidatePath(`/dashboard/trechos/${relatorio.trechoId}/rft`); // Alerta o Fiscal
    revalidatePath(`/dashboard/trechos/${relatorio.trechoId}/rds`); // Alerta o Fiscal

    return { success: 'Cancelamento aprovado. O relatório voltou para "Reprovado".' };
  } catch (error) {
    console.error('Falha ao aprovar cancelamento:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Rejeita uma solicitação de cancelamento.
 * O relatório volta para o estado APROVADO.
 */
export async function rejectCancellation(
  relatorioId: string,
): Promise<ApprovalResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão (APENAS ADMIN)
  // @ts-expect-error Corrigido
  if (session?.user?.role !== Role.ADMIN) {
    return { error: 'Acesso negado. Requer permissão de Administrador.' };
  }

  try {
    await prisma.relatorio.update({
      where: { id: relatorioId },
      data: {
        statusAprovacao: StatusAprovacao.APROVADO, // Volta para APROVADO
        motivoCancelamento: null, // Limpa o motivo
      },
    });

    revalidatePath('/dashboard-engenheiro/aprovacoes');
    revalidatePath('/dashboard-admin/cancelamentos');

    return { success: 'Solicitação de cancelamento rejeitada.' };
  } catch (error) {
    console.error('Falha ao rejeitar cancelamento:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}