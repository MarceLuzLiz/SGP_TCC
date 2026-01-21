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

interface CreateViaResult extends ActionResult {
  newViaId?: string;
}

// --- NOVA FUNÇÃO AUXILIAR ---
/**
 * Converte um valor em metros para o formato de estaca "X + Ym".
 * Ex: 816m -> "40 + 16m"
 */
function metrosParaEstacaString(metros: number): string {
  const estacasCompletas = Math.floor(metros / 20);
  const metrosRestantes = metros % 20;
  // Usamos toFixed(0) para evitar casas decimais na sobra
  return `${estacasCompletas} + ${metrosRestantes.toFixed(0)}m`;
}
// ----------------------------

/**
 * MÓDULO 2: ENGENHEIRO
 * Cria uma nova Via no sistema.
 * Recebe os dados do formulário e o JSON do traçado do mapa.
 */
export async function createVia(formData: FormData): Promise<CreateViaResult> {
  const session = await getServerSession(authOptions);

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  // 2. Coleta de Dados do Formulário
  const name = formData.get('name') as string;
  const bairro = formData.get('bairro') as string;
  const municipio = formData.get('municipio') as string;
  const estado = formData.get('estado') as string;
  
  // Dados vindos do mapa (calculados no frontend e enviados)
  const extensaoKmStr = formData.get('extensaoKm') as string;
  const trajetoJsonStr = formData.get('trajetoJson') as string; // Espera um JSON stringificado

  if (!name || !bairro || !municipio || !estado || !extensaoKmStr || !trajetoJsonStr) {
    return { error: 'Todos os campos, incluindo o desenho no mapa, são obrigatórios.' };
  }

  try {
    const extensaoKm = parseFloat(extensaoKmStr);
    const trajetoJson = JSON.parse(trajetoJsonStr); // Converte a string em objeto JSON

    if (isNaN(extensaoKm) || extensaoKm <= 0) {
      return { error: 'Extensão em Km inválida.' };
    }
    if (!Array.isArray(trajetoJson) || trajetoJson.length < 2) {
      return { error: 'Traçado do mapa inválido. São necessários ao menos 2 pontos.' };
    }

    // --- CÁLCULO DA ESTACA (VIA) ---
    const extensaoMetros = extensaoKm * 1000;
    const estacasVia = metrosParaEstacaString(extensaoMetros);
    // --------------------------------

    // 3. Criação da Via
    const newVia = await prisma.via.create({
      data: {
        name,
        bairro,
        municipio,
        estado,
        extensaoKm,
        trajetoJson: trajetoJson, // Salva o objeto JSON no banco
        estacas: estacasVia,
      },
    });

    // 4. Revalidação e Resposta
    revalidatePath('/dashboard-engenheiro/vias'); // Revalida a lista de vias

    return { 
      success: 'Via criada com sucesso! Agora, defina os trechos.',
      newViaId: newVia.id, // Retorna o ID para o frontend redirecionar
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

  // 1. Validação de Sessão e Permissão
  // @ts-expect-error Corrigido
  if (!session?.user?.id || session.user.role !== Role.ENGENHEIRO) {
    return { error: 'Acesso negado. Requer permissão de Engenheiro.' };
  }

  // 2. Coleta de Dados
  const viaId = formData.get('viaId') as string;
  const nome = formData.get('nome') as string;
  const kmInicialStr = formData.get('kmInicial') as string;
  const kmFinalStr = formData.get('kmFinal') as string;
  const cor = formData.get('cor') as string;

  if (!viaId || !nome || !kmInicialStr || !kmFinalStr|| !cor) {
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
    // Ex: "10 + 4m até 20 + 12m"

    // 3. Criação do Trecho
    await prisma.trecho.create({
      data: {
        nome,
        kmInicial,
        kmFinal,
        viaId: viaId,
        cor: cor,
        estacas: estacasTrecho,
      },
    });

    // 4. Revalidação
    revalidatePath(`/dashboard-engenheiro/vias/${viaId}`); // Revalida a página de detalhes da via

    return { success: 'Trecho adicionado com sucesso!' };

  } catch (error) {
    console.error('Falha ao criar Trecho:', error);
    // @ts-expect-error Corrigido
    if (error.code === 'P2003') { // Foreign key constraint
      return { error: 'A Via associada não foi encontrada.' };
    }
    return { error: 'Ocorreu um erro no servidor ao criar o trecho.' };
  }
}