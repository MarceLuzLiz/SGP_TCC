'use server';

import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

interface ActionResult {
  success?: string;
  error?: string;
}

// Função auxiliar para verificar se o usuário é Admin
async function verifyAdmin(): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  // @ts-expect-error Corrigido
  if (session?.user?.role !== Role.ADMIN) {
    return { error: 'Acesso negado. Requer permissão de Administrador.' };
  }
  return {};
}

/**
 * MÓDULO 3: ADMIN
 * Suspende um usuário (Fiscal ou Engenheiro).
 */
export async function suspendUser(userId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  if (!userId) return { error: 'ID do usuário é necessário.' };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: true },
    });
    revalidatePath('/dashboard-admin/usuarios');
    return { success: 'Usuário suspenso com sucesso.' };
  } catch {
    return { error: 'Falha ao suspender usuário.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Reativa um usuário suspenso.
 */
export async function reactivateUser(userId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  if (!userId) return { error: 'ID do usuário é necessário.' };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isSuspended: false },
    });
    revalidatePath('/dashboard-admin/usuarios');
    return { success: 'Usuário reativado com sucesso.' };
  } catch {
    return { error: 'Falha ao reativar usuário.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Cria um novo usuário (Fiscal ou Engenheiro).
 */
export async function createUser(formData: FormData): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as Role;

  if (!name || !email || !password || !role) {
    return { error: 'Todos os campos são obrigatórios.' };
  }
  if (password.length < 6) {
    return { error: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  if (role === Role.ADMIN) {
    return { error: 'Não é permitido criar outros Admins por este formulário.' };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        isSuspended: false,
      },
    });

    revalidatePath('/dashboard-admin/usuarios');
    return { success: 'Novo usuário criado com sucesso!' };
  } catch (error) {
    // @ts-expect-error Corrigido
    if (error.code === 'P2002') {
      return { error: 'Este email já está em uso.' };
    }
    return { error: 'Falha ao criar usuário.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Restaura um Trecho suspenso, reativando-o para uso normal.
 */
export async function restoreTrecho(trechoId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  try {
    const trecho = await prisma.trecho.findUnique({ where: { id: trechoId } });
    if (!trecho) return { error: 'Trecho não encontrado.' };

    await prisma.trecho.update({
      where: { id: trechoId },
      data: {
        isSuspended: false,
        motivoSuspensao: null,
      },
    });

    revalidatePath('/dashboard-admin/exclusoes');
    revalidatePath(`/dashboard-engenheiro/vias/${trecho.viaId}`);
    return { success: `Trecho "${trecho.nome}" restaurado com sucesso!` };
  } catch (error) {
    console.error('Erro ao restaurar trecho:', error);
    return { error: 'Falha ao restaurar trecho.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Restaura uma Via suspensa, reativando a via e seus trechos.
 */
export async function restoreVia(viaId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  try {
    const via = await prisma.via.findUnique({ where: { id: viaId } });
    if (!via) return { error: 'Via não encontrada.' };

    await prisma.$transaction([
      prisma.via.update({
        where: { id: viaId },
        data: {
          isSuspended: false,
          motivoSuspensao: null,
        },
      }),
      prisma.trecho.updateMany({
        where: { viaId },
        data: {
          isSuspended: false,
          motivoSuspensao: null,
        },
      }),
    ]);

    revalidatePath('/dashboard-admin/exclusoes');
    revalidatePath('/dashboard-engenheiro/vias');
    return { success: `Via "${via.name}" restaurada com sucesso!` };
  } catch (error) {
    console.error('Erro ao restaurar via:', error);
    return { error: 'Falha ao restaurar via.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Exclui definitivamente (Hard Delete) um Trecho e seus vínculos em transação segura.
 */
export async function permanentDeleteTrecho(trechoId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  try {
    const trecho = await prisma.trecho.findUnique({
      where: { id: trechoId },
      include: {
        relatorios: { select: { id: true } },
      },
    });

    if (!trecho) return { error: 'Trecho não encontrado.' };

    const relatorioIds = trecho.relatorios.map((r) => r.id);

    await prisma.$transaction([
      // 1. Remover itens consolidados e fotos de relatórios
      prisma.relatorioFoto.deleteMany({
        where: { relatorioId: { in: relatorioIds } },
      }),
      prisma.relatorioViaItem.deleteMany({
        where: { relatorioOrigemId: { in: relatorioIds } },
      }),
      // 2. Remover relatórios
      prisma.relatorio.deleteMany({
        where: { trechoId },
      }),
      // 3. Remover fotos
      prisma.foto.deleteMany({
        where: { trechoId },
      }),
      // 4. Remover vistorias
      prisma.vistoria.deleteMany({
        where: { trechoId },
      }),
      // 5. Remover o trecho
      prisma.trecho.delete({
        where: { id: trechoId },
      }),
    ]);

    revalidatePath('/dashboard-admin/exclusoes');
    revalidatePath(`/dashboard-engenheiro/vias/${trecho.viaId}`);
    return { success: `Trecho "${trecho.nome}" excluído permanentemente.` };
  } catch (error) {
    console.error('Erro na exclusão permanente do trecho:', error);
    return { error: 'Falha ao excluir o trecho definitivamente.' };
  }
}

/**
 * MÓDULO 3: ADMIN
 * Exclui definitivamente (Hard Delete) uma Via e todos os seus trechos/dados vinculados.
 */
export async function permanentDeleteVia(viaId: string): Promise<ActionResult> {
  const adminCheck = await verifyAdmin();
  if (adminCheck.error) return adminCheck;

  try {
    const via = await prisma.via.findUnique({
      where: { id: viaId },
      include: {
        trechos: {
          include: {
            relatorios: { select: { id: true } },
          },
        },
        relatoriosVia: { select: { id: true } },
      },
    });

    if (!via) return { error: 'Via não encontrada.' };

    const trechoIds = via.trechos.map((t) => t.id);
    const relatorioIds = via.trechos.flatMap((t) => t.relatorios.map((r) => r.id));
    const relatorioViaIds = via.relatoriosVia.map((rv) => rv.id);

    await prisma.$transaction([
      // 1. Relatórios da Via
      prisma.relatorioViaItem.deleteMany({
        where: {
          OR: [
            { relatorioViaId: { in: relatorioViaIds } },
            { relatorioOrigemId: { in: relatorioIds } },
          ],
        },
      }),
      prisma.relatorioVia.deleteMany({
        where: { viaId },
      }),
      // 2. Relatórios dos Trechos e Fotos
      prisma.relatorioFoto.deleteMany({
        where: { relatorioId: { in: relatorioIds } },
      }),
      prisma.relatorio.deleteMany({
        where: { trechoId: { in: trechoIds } },
      }),
      prisma.foto.deleteMany({
        where: { trechoId: { in: trechoIds } },
      }),
      prisma.vistoria.deleteMany({
        where: { trechoId: { in: trechoIds } },
      }),
      // 3. Usuários atribuídos
      prisma.userViaAssignment.deleteMany({
        where: { viaId },
      }),
      // 4. Trechos
      prisma.trecho.deleteMany({
        where: { viaId },
      }),
      // 5. Via
      prisma.via.delete({
        where: { id: viaId },
      }),
    ]);

    revalidatePath('/dashboard-admin/exclusoes');
    revalidatePath('/dashboard-engenheiro/vias');
    return { success: `Via "${via.name}" e todos os dados associados foram excluídos permanentemente.` };
  } catch (error) {
    console.error('Erro na exclusão permanente da via:', error);
    return { error: 'Falha ao excluir a via definitivamente.' };
  }
}

/**
 * Consulta para obter a lista de Vias e Trechos suspensos para o painel do Admin.
 */
export async function getSuspendedItems() {
  const [suspendedVias, suspendedTrechos] = await Promise.all([
    prisma.via.findMany({
      where: { isSuspended: true },
      include: {
        _count: {
          select: {
            trechos: true,
            relatoriosVia: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.trecho.findMany({
      where: { isSuspended: true },
      include: {
        via: { select: { id: true, name: true, isSuspended: true } },
        _count: {
          select: {
            vistorias: true,
            fotos: true,
            relatorios: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  return { suspendedVias, suspendedTrechos };
}