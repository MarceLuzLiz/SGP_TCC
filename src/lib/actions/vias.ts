'use server';

import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface ActionResult {
  success?: string;
  error?: string;
}

interface CreateViaResult extends ActionResult {
  newViaId?: string;
}

/**
 * Converte um valor em metros para o formato de estaca "X + Ym".
 * Ex: 816m -> "40 + 16m"
 */
function metrosParaEstacaString(metros: number): string {
  const estacasCompletas = Math.floor(metros / 20);
  const metrosRestantes = metros % 20;
  return `${estacasCompletas} + ${metrosRestantes.toFixed(0)}m`;
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Cria uma nova Via no sistema.
 */
export async function createVia(formData: FormData): Promise<CreateViaResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  const name = formData.get('name') as string;
  const bairro = formData.get('bairro') as string;
  const municipio = formData.get('municipio') as string;
  const estado = formData.get('estado') as string;
  const extensaoKmStr = formData.get('extensaoKm') as string;
  const trajetoJsonStr = formData.get('trajetoJson') as string;

  if (!name || !bairro || !municipio || !estado || !extensaoKmStr || !trajetoJsonStr) {
    return { error: 'Todos os campos, incluindo o desenho no mapa, são obrigatórios.' };
  }

  try {
    const extensaoKm = parseFloat(extensaoKmStr);
    const trajetoJson = JSON.parse(trajetoJsonStr);

    if (isNaN(extensaoKm) || extensaoKm <= 0) {
      return { error: 'Extensão em Km inválida.' };
    }
    if (!Array.isArray(trajetoJson) || trajetoJson.length < 2) {
      return { error: 'Traçado do mapa inválido. São necessários ao menos 2 pontos.' };
    }

    const extensaoMetros = extensaoKm * 1000;
    const estacasVia = metrosParaEstacaString(extensaoMetros);

    const newVia = await prisma.via.create({
      data: {
        name,
        bairro,
        municipio,
        estado,
        extensaoKm,
        trajetoJson,
        estacas: estacasVia,
        isSuspended: false,
      },
    });

    revalidatePath('/dashboard-engenheiro/vias');

    return { 
      success: 'Via criada com sucesso! Agora, defina os trechos.',
      newViaId: newVia.id,
    };

  } catch (error) {
    console.error('Falha ao criar Via:', error);
    if (error instanceof SyntaxError) {
      return { error: 'Falha ao processar o traçado do mapa (JSON inválido).' };
    }
    return { error: 'Ocorreu um erro no servidor ao criar a via.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Cria um novo Trecho vinculado a uma Via existente.
 */
export async function createTrecho(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  const viaId = formData.get('viaId') as string;
  const nome = formData.get('nome') as string;
  const kmInicialStr = formData.get('kmInicial') as string;
  const kmFinalStr = formData.get('kmFinal') as string;
  const cor = formData.get('cor') as string;

  if (!viaId || !nome || !kmInicialStr || !kmFinalStr || !cor) {
    return { error: 'Todos os campos, incluindo a cor, são obrigatórios.' };
  }

  try {
    const kmInicial = parseFloat(kmInicialStr);
    const kmFinal = parseFloat(kmFinalStr);

    if (isNaN(kmInicial) || isNaN(kmFinal)) {
      return { error: 'Km Inicial e Km Final devem ser números.' };
    }
    if (kmFinal <= kmInicial) {
      return { error: 'O Km Final deve ser maior que o Km Inicial.' };
    }

    const metrosIniciais = kmInicial * 1000;
    const metrosFinais = kmFinal * 1000;
    
    const estacaInicialStr = metrosParaEstacaString(metrosIniciais);
    const estacaFinalStr = metrosParaEstacaString(metrosFinais);
    const estacasTrecho = `${estacaInicialStr} até ${estacaFinalStr}`;

    await prisma.trecho.create({
      data: {
        nome,
        kmInicial,
        kmFinal,
        viaId,
        cor,
        estacas: estacasTrecho,
        isSuspended: false,
      },
    });

    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`);

    return { success: 'Trecho adicionado com sucesso!' };

  } catch (error) {
    console.error('Falha ao criar Trecho:', error);
    // @ts-expect-error Corrigido
    if (error.code === 'P2003') {
      return { error: 'A Via associada não foi encontrada.' };
    }
    return { error: 'Ocorreu um erro no servidor ao criar o trecho.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Solicita a exclusão de um Trecho, suspendendo-o para análise e decisão do Administrador.
 */
export async function requestSuspendTrecho(trechoId: string, motivo: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (!trechoId || !motivo || motivo.trim().length < 5) {
    return { error: 'Por favor, informe uma justificativa com pelo menos 5 caracteres.' };
  }

  try {
    const trecho = await prisma.trecho.findUnique({ where: { id: trechoId } });
    if (!trecho) return { error: 'Trecho não encontrado.' };

    await prisma.trecho.update({
      where: { id: trechoId },
      data: {
        isSuspended: true,
        motivoSuspensao: motivo.trim(),
      },
    });

    revalidatePath(`/dashboard-engenheiro/vias/${trecho.viaId}`);
    revalidatePath(`/dashboard-engenheiro/trechos/${trechoId}`);
    revalidatePath('/dashboard-admin/exclusoes');

    return { success: 'Solicitação de exclusão enviada! O trecho foi suspenso e aguarda decisão do Administrador.' };
  } catch (error) {
    console.error('Falha ao suspender trecho:', error);
    return { error: 'Erro no servidor ao solicitar a exclusão do trecho.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Solicita a exclusão de uma Via, suspendendo-a junto aos seus trechos para análise do Administrador.
 */
export async function requestSuspendVia(viaId: string, motivo: string): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (!viaId || !motivo || motivo.trim().length < 5) {
    return { error: 'Por favor, informe uma justificativa com pelo menos 5 caracteres.' };
  }

  try {
    const via = await prisma.via.findUnique({ where: { id: viaId } });
    if (!via) return { error: 'Via não encontrada.' };

    await prisma.$transaction([
      prisma.via.update({
        where: { id: viaId },
        data: {
          isSuspended: true,
          motivoSuspensao: motivo.trim(),
        },
      }),
      prisma.trecho.updateMany({
        where: { viaId },
        data: {
          isSuspended: true,
          motivoSuspensao: `Suspenso por solicitação na via: ${motivo.trim()}`,
        },
      }),
    ]);

    revalidatePath('/dashboard-engenheiro/vias');
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`);
    revalidatePath('/dashboard-admin/exclusoes');

    return { success: 'Solicitação de exclusão da via enviada com sucesso ao Administrador!' };
  } catch (error) {
    console.error('Falha ao suspender via:', error);
    return { error: 'Erro no servidor ao solicitar a exclusão da via.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO / ADMIN
 * Atualiza os dados cadastrais de uma Via (nome, bairro, município, estado).
 */
export async function updateVia(
  viaId: string,
  data: { name: string; bairro: string; municipio: string; estado: string }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (!viaId || !data.name || !data.bairro || !data.municipio || !data.estado) {
    return { error: 'Todos os campos de identificação da via são obrigatórios.' };
  }

  try {
    const via = await prisma.via.findUnique({ where: { id: viaId } });
    if (!via) return { error: 'Via não encontrada.' };

    await prisma.via.update({
      where: { id: viaId },
      data: {
        name: data.name.trim(),
        bairro: data.bairro.trim(),
        municipio: data.municipio.trim(),
        estado: data.estado.trim(),
      },
    });

    revalidatePath('/dashboard-engenheiro/vias');
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`);

    return { success: 'Dados da via atualizados com sucesso!' };
  } catch (error) {
    console.error('Falha ao atualizar via:', error);
    return { error: 'Erro no servidor ao atualizar os dados da via.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO / ADMIN
 * Atualiza os dados de um Trecho (nome e cor).
 */
export async function updateTrecho(
  trechoId: string,
  data: { nome: string; cor?: string }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (!trechoId || !data.nome || data.nome.trim().length === 0) {
    return { error: 'O nome do trecho é obrigatório.' };
  }

  try {
    const trecho = await prisma.trecho.findUnique({ where: { id: trechoId } });
    if (!trecho) return { error: 'Trecho não encontrado.' };

    await prisma.trecho.update({
      where: { id: trechoId },
      data: {
        nome: data.nome.trim(),
        cor: data.cor ? data.cor.trim() : trecho.cor,
      },
    });

    revalidatePath(`/dashboard-engenheiro/vias/${trecho.viaId}`);
    revalidatePath(`/dashboard-engenheiro/trechos/${trechoId}`);

    return { success: 'Trecho atualizado com sucesso!' };
  } catch (error) {
    console.error('Falha ao atualizar trecho:', error);
    return { error: 'Erro no servidor ao atualizar o trecho.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO / ADMIN
 * Atualiza as dimensões (kmInicial e kmFinal) de um Trecho existente.
 */
export async function updateTrechoKms(
  trechoId: string,
  data: { kmInicial: number; kmFinal: number }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (data.kmFinal <= data.kmInicial) {
    return { error: 'O Km Final deve ser maior que o Km Inicial.' };
  }

  try {
    const trecho = await prisma.trecho.findUnique({
      where: { id: trechoId },
      include: {
        via: {
          select: {
            extensaoKm: true,
            trechos: { select: { id: true, kmInicial: true, kmFinal: true, nome: true } },
          },
        },
      },
    });

    if (!trecho) return { error: 'Trecho não encontrado.' };

    if (data.kmFinal > trecho.via.extensaoKm) {
      return {
        error: `O Km Final (${data.kmFinal.toFixed(3)}) excede a extensão total da via (${trecho.via.extensaoKm.toFixed(3)} km).`,
      };
    }

    // Verificar sobreposição com outros trechos
    const otherTrechos = trecho.via.trechos.filter((t) => t.id !== trechoId);
    for (const other of otherTrechos) {
      const overlap = data.kmInicial < other.kmFinal && data.kmFinal > other.kmInicial;
      if (overlap) {
        return {
          error: `Os novos limites sobrepõem o trecho "${other.nome}" (Km ${other.kmInicial.toFixed(3)} - ${other.kmFinal.toFixed(3)}).`,
        };
      }
    }

    // Recalcular estacas
    const metrosIniciais = data.kmInicial * 1000;
    const metrosFinais = data.kmFinal * 1000;
    const estacaInicialStr = metrosParaEstacaString(metrosIniciais);
    const estacaFinalStr = metrosParaEstacaString(metrosFinais);
    const estacasTrecho = `${estacaInicialStr} até ${estacaFinalStr}`;

    await prisma.trecho.update({
      where: { id: trechoId },
      data: {
        kmInicial: data.kmInicial,
        kmFinal: data.kmFinal,
        estacas: estacasTrecho,
      },
    });

    revalidatePath(`/dashboard-engenheiro/vias/${trecho.viaId}`);
    revalidatePath(`/dashboard-engenheiro/trechos/${trechoId}`);

    return { success: 'Dimensões do trecho atualizadas com sucesso!' };
  } catch (error) {
    console.error('Falha ao atualizar dimensões do trecho:', error);
    return { error: 'Erro no servidor ao atualizar as dimensões do trecho.' };
  }
}

/**
 * MÓDULO 2: ENGENHEIRO / ADMIN
 * Atualiza a geometria de uma Via (extensão e trajetoJson).
 */
export async function updateViaGeometry(
  viaId: string,
  data: { extensaoKm: number; trajetoJson: any }
): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  // @ts-expect-error Corrigido
  if (!session?.user?.id || (session.user.role !== Role.ENGENHEIRO && session.user.role !== Role.ADMIN)) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro ou Administrador.' };
  }

  if (data.extensaoKm <= 0) {
    return { error: 'A extensão deve ser maior que zero.' };
  }

  if (!Array.isArray(data.trajetoJson) || data.trajetoJson.length < 2) {
    return { error: 'O trajetoJson deve conter ao menos 2 coordenadas.' };
  }

  try {
    const via = await prisma.via.findUnique({
      where: { id: viaId },
      include: { trechos: { select: { id: true, kmFinal: true, nome: true } } },
    });

    if (!via) return { error: 'Via não encontrada.' };

    const maxTrechoKmFinal =
      via.trechos.length > 0 ? Math.max(...via.trechos.map((t) => t.kmFinal)) : 0;

    if (data.extensaoKm < maxTrechoKmFinal) {
      return {
        error: `A extensão (${data.extensaoKm.toFixed(3)} km) não pode ser menor que o Km Final do último trecho (${maxTrechoKmFinal.toFixed(3)} km).`,
      };
    }

    const extensaoMetros = data.extensaoKm * 1000;
    const estacasVia = metrosParaEstacaString(extensaoMetros);

    await prisma.via.update({
      where: { id: viaId },
      data: {
        extensaoKm: data.extensaoKm,
        trajetoJson: data.trajetoJson,
        estacas: estacasVia,
      },
    });

    revalidatePath('/dashboard-engenheiro/vias');
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`);

    return { success: 'Geometria da via atualizada com sucesso!' };
  } catch (error) {
    console.error('Falha ao atualizar geometria da via:', error);
    return { error: 'Erro no servidor ao atualizar a geometria da via.' };
  }
}