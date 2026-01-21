'use server';

import { PrismaClient, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

interface ActionResult {
  success?: string;
  error?: string;
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Atribui um usuário (Fiscal) a uma Via.
 */
export async function assignFiscalToVia(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  const userId = formData.get('userId') as string; // ID do Fiscal a ser atribuído
  const viaId = formData.get('viaId') as string;

  if (!userId || !viaId) {
    return { error: 'ID do Fiscal e ID da Via são obrigatórios.' };
  }

  try {
    // 2. Verifica se a atribuição já existe
    const existingAssignment = await prisma.userViaAssignment.findUnique({
      where: {
        userId_viaId: { // Usa a chave primária composta definida no schema
          userId: userId,
          viaId: viaId,
        },
      },
    });

    if (existingAssignment) {
      return { error: 'Este fiscal já está atribuído a esta via.' };
    }

    // 3. Cria a nova atribuição
    await prisma.userViaAssignment.create({
      data: {
        userId: userId,
        viaId: viaId,
      },
    });

    // 4. Revalida o cache da página de equipe
    revalidatePath('/dashboard-engenheiro/equipe');

    return { success: 'Fiscal atribuído com sucesso!' };

  } catch (error) {
    console.error('Falha ao atribuir fiscal:', error);
    // @ts-expect-error Corrigido
    if (error.code === 'P2003') { // Foreign key constraint failed
      return { error: 'Usuário (Fiscal) ou Via não encontrado(a).' };
    }
    return { error: 'Ocorreu um erro no servidor ao tentar atribuir.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Remove a atribuição de um usuário (Fiscal) de uma Via.
 */
export async function removeFiscalFromVia(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  const userId = formData.get('userId') as string; // ID do Fiscal
  const viaId = formData.get('viaId') as string;

  if (!userId || !viaId) {
    return { error: 'ID do Fiscal e ID da Via são obrigatórios.' };
  }

  try {
    // 2. Deleta a atribuição usando a chave composta
    await prisma.userViaAssignment.delete({
      where: {
        userId_viaId: {
          userId: userId,
          viaId: viaId,
        },
      },
    });

    // 3. Revalida o cache
    revalidatePath('/dashboard-engenheiro/equipe');

    return { success: 'Atribuição do fiscal removida com sucesso!' };

  } catch (error) {
    console.error('Falha ao remover atribuição:', error);
    // @ts-expect-error Corrigido// @ts-ignore
    if (error.code === 'P2025') { // Record to delete not found
      return { error: 'Atribuição não encontrada.' };
    }
    return { error: 'Ocorreu um erro no servidor ao tentar remover.' };
  }
}