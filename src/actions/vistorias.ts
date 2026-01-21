'use server';

import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

interface ActionResult {
  success?: string;
  error?: string;
}

export async function createVistoria(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);
  
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    return { error: 'Usuário não autenticado.' };
  }

  const trechoId = formData.get('trechoId') as string;
  const dataVistoriaStr = formData.get('dataVistoria') as string;
  const motivo = formData.get('motivo') as string;

  if (!trechoId || !dataVistoriaStr || !motivo) {
    return { error: 'Todos os campos são obrigatórios.' };
  }

  try {
    const dataObj = new Date(dataVistoriaStr);
    dataObj.setUTCHours(23, 59, 59, 999);

    await prisma.vistoria.create({
      data: {
        dataVistoria: dataObj,
        motivo: motivo,
        trechoId: trechoId,
        // @ts-expect-error Corrigido
        userId: session.user.id,
      },
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/vistorias`);

    return { success: 'Vistoria criada com sucesso!' };
  } catch (error) {
    console.error(error);
    return { error: 'Falha ao criar vistoria.' };
  }
}

export async function updateVistoria(formData: FormData): Promise<ActionResult> {
  const vistoriaId = formData.get('vistoriaId') as string;
  const trechoId = formData.get('trechoId') as string;
  const dataVistoriaStr = formData.get('dataVistoria') as string;
  const motivo = formData.get('motivo') as string;

  if (!vistoriaId || !trechoId || !dataVistoriaStr || !motivo) {
    return { error: 'Todos os campos são obrigatórios.' };
  }

  try {
    const dataObj = new Date(dataVistoriaStr);
    dataObj.setUTCHours(23, 59, 59, 999);

    await prisma.vistoria.update({
      where: { id: vistoriaId },
      data: {
        dataVistoria: dataObj,
        motivo: motivo,
      },
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/vistorias`);
    return { success: 'Vistoria atualizada com sucesso!' };
  } catch (error) {
    console.error('Falha ao atualizar vistoria:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}

export async function deleteVistoria(vistoriaId: string, trechoId: string): Promise<ActionResult> {
  if (!vistoriaId || !trechoId) {
    return { error: 'IDs da vistoria e do trecho são necessários.' };
  }

  try {
    const relatorioVinculado = await prisma.relatorio.findFirst({
      where: { vistoriaId: vistoriaId },
    });

    if (relatorioVinculado) {
      return { error: 'Não é possível excluir. Esta vistoria possui relatórios (RFT/RDS) vinculados.' };
    }

    await prisma.vistoria.delete({
      where: { id: vistoriaId },
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/vistorias`);
    return { success: 'Vistoria excluída com sucesso!' };
  } catch (error) {
    console.error('Falha ao excluir vistoria:', error);
    return { error: 'Ocorreu um erro no servidor.' };
  }
}