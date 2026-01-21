import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getFilteredRelatorios, getAllFiscaisSimple } from '@/lib/data/engenheiro';
import { StatusAprovacao, RelatorioTipo } from '@prisma/client';
import { RelatoriosClientPage } from './_components/relatorios-client-page'; // Criaremos a seguir
import { FileSearch } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    fiscalId?: string;
    tipo?: string;
    status?: string;
  }>;
}) {
  const resolvedSearchParams = await searchParams;
  const { from, to, fiscalId, tipo, status } = resolvedSearchParams;

  // Converte os 'searchParams' (strings) para os tipos do Prisma
  const tipoFiltro = tipo ? (tipo as RelatorioTipo) : undefined;
  
  // Converte a string de status (ex: "APROVADO") para o enum
  // Ou lida com "pendentes" (que são dois status)
  let statusFiltro: StatusAprovacao[] = [];
  if (status === 'PENDENTES') {
    statusFiltro = [StatusAprovacao.PENDENTE, StatusAprovacao.CORRIGIDO];
  } else if (status) {
    statusFiltro = [status as StatusAprovacao];
  }

  // Busca os dados para a lista de fiscais (para o dropdown)
  const fiscaisList = await getAllFiscaisSimple();

  // Busca os relatórios filtrados
  const relatorios = await getFilteredRelatorios({
    from,
    to,
    fiscalId,
    tipo: tipoFiltro,
    status: statusFiltro,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSearch className="mr-2 h-5 w-5 text-primary" />
            Relatórios do Sistema
          </CardTitle>
          <CardDescription>
            Pesquise e filtre todos os relatórios RFT e RDS do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RelatoriosClientPage
            relatorios={relatorios}
            fiscaisList={fiscaisList}
          />
        </CardContent>
      </Card>
    </div>
  );
}