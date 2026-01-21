import { Prisma, PrismaClient, RelatorioTipo, StatusAprovacao } from '@prisma/client';
import { Role } from '@prisma/client';
import {
  calculateIGGForTrecho,
  calculateIGGForVia,
  getIggHistoryForTrecho,
} from '@/lib/utils/igg';

const prisma = new PrismaClient();

/**
 * MÓDULO 2: ENGENHEIRO
 * Busca todos os relatórios (RFT e RDS) que estão aguardando
 * aprovação ou que foram corrigidos pelo fiscal.
 *
 * Inclui dados relacionados para exibir na fila (Usuário, Trecho, Via).
 */
export async function getApprovalQueue() {
  try {
    const queue = await prisma.relatorio.findMany({
      where: {
        // A fila do engenheiro é composta por relatórios PENDENTES ou CORRIGIDOS
        statusAprovacao: {
          in: [StatusAprovacao.PENDENTE, StatusAprovacao.CORRIGIDO],
        },
      },
      include: {
        // Inclui o usuário (Fiscal) que enviou o relatório
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Inclui o trecho ao qual o relatório pertence
        trecho: {
          include: {
            // E inclui a Via para dar contexto completo (Ex: "Via X / Trecho Y")
            via: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        // Conta quantas fotos estão vinculadas a este relatório
        _count: {
          select: {
            fotos: true,
          },
        },
      },
      orderBy: {
        // Exibe os mais antigos primeiro (ou os corrigidos)
        updatedAt: 'asc',
      },
    });

    return queue;
  } catch (error) {
    console.error('Falha ao buscar fila de aprovação:', error);
    throw new Error('Não foi possível carregar os relatórios pendentes.');
  }
}


/**
 * MÓDULO 2: ENGENHEIRO
 * Busca todos os detalhes de uma Via específica, incluindo
 * seus trechos e todos os dados aninhados (fotos, relatórios, vistorias)
 * necessários para a página de "Detalhes da Via".
 */
export async function getViaDetails(viaId: string) {
  if (!viaId) {
    return null;
  }

  try {
    const via = await prisma.via.findUnique({
      where: {
        id: viaId,
      },
      include: {
        _count: {
          select: { trechos: true },
        },
        // 1. Busca todos os trechos desta via
        trechos: {
          orderBy: {
            kmInicial: 'asc', // Ordena os trechos por Km
          },
          include: {
            // 2. Para CADA trecho, busca todos os dados associados
            
            // Para as Abas "RFTs" e "RDSs"
            relatorios: {
              include: {
                user: { // Pega o fiscal que criou o relatório
                  select: { name: true },
                },
                _count: { // Conta as fotos do relatório
                  select: { fotos: true },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },

            // Para a Aba "Galeria de Fotos" e o "Mapa Interativo"
            fotos: {
              include: {
                patologia: true, // Essencial para o cálculo do IGG
                rdsOcorrencia: true,
                user: { // Pega o fiscal que tirou a foto
                  select: { name: true },
                },
              },
              orderBy: {
                dataCaptura: 'desc',
              },
            },

            // Para a Aba "Vistorias"
            vistorias: {
              include: {
                user: { // Pega o fiscal que fez a vistoria
                  select: { name: true },
                },
              },
              orderBy: {
                dataVistoria: 'desc',
              },
            },
          },
        },
      },
    });

    if (!via) {
      throw new Error('Via não encontrada.');
    }

    // --- 2. LÓGICA DE CÁLCULO ATUALIZADA ---

    // 2a. Calcula o IGG da VIA (Correto)
    const totalIggVia = await calculateIGGForVia(via.id);

    // 2b. Calcula o IGG de cada Trecho (para exibição na lista)
    const trechosComIgg = [];
    for (const trecho of via.trechos) {
      const iggTrecho = await calculateIGGForTrecho(trecho.id);
      trechosComIgg.push({
        ...trecho,
        igg: iggTrecho,
      });
    }
    // --- FIM DO CÁLCULO ---

    // 3. RETORNA O OBJETO COMPLETO
    return {
      ...via,
      trechos: trechosComIgg,   // Trechos com seus IGGs individuais
      igg: totalIggVia,         // IGG total da Via (calculado corretamente)
    };

  } catch (error) {
    console.error('Falha ao buscar detalhes da via:', error);
    // @ts-expect-error Corrigido
    throw new Error(`Não foi possível carregar os dados da via: ${error.message}`);
  }
}

export async function getTrechoDetails(trechoId: string) {
  if (!trechoId) {
    return null;
  }

  try {
    // 2. BUSCAR OS DADOS DO TRECHO (como antes)
    const trecho = await prisma.trecho.findUnique({
      where: {
        id: trechoId,
      },
      include: {
        via: {
          select: {
            id: true,
            name: true,
            extensaoKm: true,
            trajetoJson: true,
          },
        },
        relatorios: {
          include: {
            user: { select: { name: true } },
            _count: { select: { fotos: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        fotos: {
          include: {
            patologia: true,
            rdsOcorrencia: true,
            user: { select: { name: true } },
          },
          orderBy: { dataCaptura: 'desc' },
        },
        vistorias: {
          include: {
            user: { select: { name: true } },
            _count: { select: { fotos: true } },
          },
          orderBy: { dataVistoria: 'asc' }, // Corrigido para dataVistoria
        },
      },
    });

    if (!trecho) {
      throw new Error('Trecho não encontrado.');
    }

    // 3. CALCULAR O IGG
    // Chama a função que acabamos de criar
    const igg = await calculateIGGForTrecho(trecho.id);

    // 3.1. CHAMAR A NOVA FUNÇÃO
    const iggHistory = await getIggHistoryForTrecho(trecho.id);

    // 4. RETORNAR OS DADOS COMBINADOS
    return {
      ...trecho,
      igg: igg, // Adiciona o IGG calculado ao objeto do trecho
      iggHistory: iggHistory,
    };

  } catch (error) {
    console.error('Falha ao buscar detalhes do trecho:', error);
    // @ts-expect-error Corrigido
    throw new Error(`Não foi possível carregar os dados do trecho: ${error.message}`);
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Busca todos os usuários que são Fiscais, incluindo
 * as vias que eles já têm atribuídas.
 */
export async function getFiscaisComAtribuicoes() {
  try {
    const fiscais = await prisma.user.findMany({
      where: {
        role: Role.FISCAL,
      },
      include: {
        assignedVias: { // Relação UserViaAssignment
          include: {
            via: { // A Via de fato
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return fiscais;
  } catch (error) {
    console.error('Falha ao buscar fiscais:', error);
    throw new Error('Não foi possível carregar os fiscais.');
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Busca uma lista simples de todas as Vias (ID e Nome)
 * para usar em formulários de seleção.
 */
export async function getAllViasSimple() {
  try {
    const vias = await prisma.via.findMany({
      select: {
        id: true,
        name: true,
        estacas: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return vias;
  } catch (error) {
    console.error('Falha ao buscar vias:', error);
    throw new Error('Não foi possível carregar as vias.');
  }
}

/**
 * MÓDULO 2: ENGENHEIRO
 * Busca todas as Vias cadastradas, incluindo uma contagem
 * de quantos trechos cada uma possui.
 */
export async function getViasComContagemTrechos() {
  try {
    const vias = await prisma.via.findMany({
      include: {
        _count: {
          select: { trechos: true }, // Conta quantos trechos esta via tem
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return vias;
  } catch (error) {
    console.error('Falha ao buscar lista de vias:', error);
    throw new Error('Não foi possível carregar as vias.');
  }
}

export async function getAllFiscaisSimple() {
  try {
    const fiscais = await prisma.user.findMany({
      where: { role: Role.FISCAL, isSuspended: false },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    return fiscais;
  } catch (error) {
    console.error('Falha ao buscar lista de fiscais:', error);
    throw new Error('Não foi possível carregar os fiscais.');
  }
}

/**
 * Busca os detalhes de UM fiscal, incluindo suas vias.
 * (Para a nova página /equipe)
 */
export async function getFiscalDetails(userId: string) {
  try {
    const fiscal = await prisma.user.findUnique({
      where: { id: userId, role: Role.FISCAL },
      include: {
        assignedVias: {
          include: {
            via: {
              select: { id: true, name: true, estacas: true },
            },
          },
          orderBy: { via: { name: 'asc' } },
        },
      },
    });
    return fiscal;
  } catch (error) {
    console.error('Falha ao buscar detalhes do fiscal:', error);
    throw new Error('Não foi possível carregar os dados do fiscal.');
  }
}

/**
 * [FUNÇÃO PRINCIPAL DE FILTRAGEM]
 * Busca relatórios com base em um conjunto flexível de filtros.
 * (Para as páginas /aprovacoes e /relatorios)
 */
interface FilterOptions {
  status?: StatusAprovacao[];
  fiscalId?: string;
  tipo?: RelatorioTipo;
  from?: string;
  to?: string;
}

export async function getFilteredRelatorios(options: FilterOptions) {
  const { status, fiscalId, tipo, from, to } = options;

  const whereClause: Prisma.RelatorioWhereInput = {};

  if (status && status.length > 0) {
    whereClause.statusAprovacao = { in: status };
  }
  if (fiscalId) {
    whereClause.userId = fiscalId;
  }
  if (tipo) {
    whereClause.tipo = tipo;
  }
  if (from || to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) {
      dateFilter.gte = new Date(from);
    }
    if (to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1); // Para incluir o dia final
      dateFilter.lt = endDate;
    }
    whereClause.createdAt = dateFilter; // Filtra pela data de CRIAÇÃO do relatório
  }

  try {
    const relatorios = await prisma.relatorio.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } }, // Fiscal
        trecho: { select: { id: true, nome: true, via: { select: { name: true } } } }, // Local
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
    return relatorios;
  } catch (error) {
    console.error('Falha ao buscar relatórios filtrados:', error);
    throw new Error('Não foi possível carregar os relatórios.');
  }
}

/**
 * MÓDULO 3: ADMIN
 * Busca todos os relatórios que estão pendentes de cancelamento.
 */
export async function getCancellationQueue() {
  try {
    const relatorios = await prisma.relatorio.findMany({
      where: {
        statusAprovacao: StatusAprovacao.CANCELAMENTO_PENDENTE,
      },
      include: {
        user: { select: { name: true } }, // Fiscal que enviou
        trecho: { select: { nome: true, via: { select: { name: true } } } },
      },
      orderBy: {
        updatedAt: 'asc', // Mais antigos primeiro
      },
    });
    return relatorios;
  } catch (error) {
    console.error('Falha ao buscar fila de cancelamento:', error);
    throw new Error('Não foi possível carregar as solicitações.');
  }
}

/**
 * MÓDULO 3: ADMIN
 * Busca TODOS os usuários do sistema para a página de gestão.
 */
export async function getAllUsersForAdmin() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [
        { role: 'asc' }, // Admins primeiro
        { name: 'asc' },
      ],
      // Não selecionamos a 'password' por segurança
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuspended: true,
        createdAt: true,
      },
    });
    return users;
  } catch (error) {
    console.error('Falha ao buscar usuários:', error);
    throw new Error('Não foi possível carregar os usuários.');
  }
}