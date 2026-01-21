'use server';

import { PrismaClient, Foto, Patologia, RdsOcorrencia, StatusAprovacao } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// Tipagem completa para a foto retornada
type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface ActionResult {
  success?: string;
  error?: string;
}

interface UpdateResult extends ActionResult {
  updatedFoto?: FotoCompleta;
}

export async function deleteFoto(fotoId: string, trechoId: string): Promise<ActionResult> {
  if (!fotoId || !trechoId) {
    return { error: 'IDs da foto e do trecho são necessários.' };
  }

  try {
    // REGRA DE EXCLUSÃO (Já implementada):
    // Verifica se a foto está em QUALQUER relatório.
    const fotoEmRelatorio = await prisma.relatorioFoto.findFirst({
      where: { fotoId: fotoId },
    });

    if (fotoEmRelatorio) {
      return { error: 'Não é possível excluir. Esta foto está vinculada a um ou mais relatórios.' };
    }

    await prisma.foto.delete({
      where: { id: fotoId },
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/galeria`);

    return { success: 'Foto excluída com sucesso!' };

  } catch (error) {
    console.error('Falha ao deletar foto:', error);
    return { error: 'Ocorreu um erro no servidor ao tentar excluir a foto.' };
  }
}

// --- FUNÇÃO ATUALIZADA ---
export async function updateFotoDetails(formData: FormData): Promise<UpdateResult> {
  const fotoId = formData.get('fotoId') as string;
  const trechoId = formData.get('trechoId') as string;
  const tipo = formData.get('tipo') as 'RFT' | 'RDS';

  if (!fotoId || !trechoId) {
    return { error: 'IDs da foto e do trecho são necessários.' };
  }

  try {
    // --- REGRA DE EDIÇÃO (BACKEND) ---
    // 1. Verifica se esta foto está em algum relatório APROVADO.
    const relatoriosAprovadosCount = await prisma.relatorioFoto.count({
      where: {
        fotoId: fotoId,
        relatorio: {
          statusAprovacao: StatusAprovacao.APROVADO,
        },
      },
    });

    // 2. Se estiver, bloqueia a edição.
    if (relatoriosAprovadosCount > 0) {
      return { error: 'Não é possível editar. Esta foto está vinculada a um relatório que já foi aprovado.' };
    }
    // --- FIM DA NOVA REGRA ---

    // 3. Se a verificação passar, continua com a atualização
    
    // --- CORREÇÃO DO ERRO 'any' ---
    // Define um tipo estrito para o objeto de dados
    const updatedData: {
      descricao: string | null;
      patologiaId?: string | null;
      rdsOcorrenciaId?: string | null;
      extensaoM?: number | null;
      larguraM?: number | null;
    } = {
      descricao: formData.get('descricao') as string | null,
    };
    // --- FIM DA CORREÇÃO ---

    if (tipo === 'RFT') {
      updatedData.patologiaId = formData.get('patologiaId') as string;
      updatedData.rdsOcorrenciaId = null;
      updatedData.extensaoM = parseFloat(formData.get('extensaoM') as string) || null;
      updatedData.larguraM = parseFloat(formData.get('larguraM') as string) || null;
    } else if (tipo === 'RDS') {
      updatedData.rdsOcorrenciaId = formData.get('rdsOcorrenciaId') as string;
      updatedData.patologiaId = null;
    }

    const updatedFoto = await prisma.foto.update({
      where: { id: fotoId },
      data: updatedData,
      include: {
        patologia: true,
        rdsOcorrencia: true,
      },
    });

    revalidatePath(`/dashboard/trechos/${trechoId}/galeria`);

    return { success: 'Detalhes da foto atualizados com sucesso!', updatedFoto };

  } catch (error) {
    console.error('Falha ao atualizar foto:', error);
    return { error: 'Ocorreu um erro no servidor ao tentar atualizar a foto.' };
  }
}