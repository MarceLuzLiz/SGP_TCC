'use server';

import { PrismaClient, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
  } catch (error) {
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
  } catch (error) {
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
  const role = formData.get('role') as Role; // Ex: 'FISCAL' ou 'ENGENHEIRO'

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
    // Criptografa a senha
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
    if (error.code === 'P2002') { // Erro de violação de constraint (email único)
      return { error: 'Este email já está em uso.' };
    }
    return { error: 'Falha ao criar usuário.' };
  }
}