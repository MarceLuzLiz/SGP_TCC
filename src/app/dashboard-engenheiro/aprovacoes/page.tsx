import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFilteredRelatorios, getAllFiscaisSimple } from '@/lib/data/engenheiro';
import { StatusAprovacao } from '@prisma/client';
import { ApprovalClientPage } from './_components/approval-client-page';
import { CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AprovacoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    fiscalId?: string;
    tab?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { from, to, fiscalId } = resolvedSearchParams;

  const filterOptions = { from, to, fiscalId };

  // Busca dados separados para cada aba
  const [
    pendentes,
    corrigidos, // <-- NOVO
    cancelamentoPendente, // <-- NOVO
    aprovados,
    reprovados,
    fiscaisList
  ] = await Promise.all([
    // 1. Pendentes (Apenas pendentes puros)
    getFilteredRelatorios({
      ...filterOptions,
      status: [StatusAprovacao.PENDENTE],
    }),
    // 2. Corrigidos (Separados)
    getFilteredRelatorios({
      ...filterOptions,
      status: [StatusAprovacao.CORRIGIDO],
    }),
    // 3. Em Análise de Cancelamento
    getFilteredRelatorios({
      ...filterOptions,
      status: [StatusAprovacao.CANCELAMENTO_PENDENTE],
    }),
    // 4. Aprovados
    getFilteredRelatorios({
      ...filterOptions,
      status: [StatusAprovacao.APROVADO],
    }),
    // 5. Reprovados
    getFilteredRelatorios({
      ...filterOptions,
      status: [StatusAprovacao.REPROVADO],
    }),
    getAllFiscaisSimple(),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-primary" />
            Fila de Aprovação e Histórico
          </CardTitle>
          <CardDescription>
            Gerencie o fluxo completo de relatórios, desde a correção até o cancelamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApprovalClientPage
            pendentes={pendentes}
            corrigidos={corrigidos}
            cancelamentoPendente={cancelamentoPendente}
            aprovados={aprovados}
            reprovados={reprovados}
            fiscaisList={fiscaisList}
          />
        </CardContent>
      </Card>
    </div>
  );
}