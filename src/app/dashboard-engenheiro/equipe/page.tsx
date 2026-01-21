import {
  getAllFiscaisSimple,
  getAllViasSimple,
  getFiscalDetails,
} from '@/lib/data/engenheiro';
import { EquipeClientPage } from './_components/equipe-client-page'; // Criaremos a seguir
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Usando a convenção de 'searchParams' como Promise (Next 15.5)
export default async function EquipePage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const userId = resolvedSearchParams.userId;

  // Busca os dados de base para os dropdowns
  const fiscaisList = await getAllFiscaisSimple();
  const viasList = await getAllViasSimple();

  // Busca os detalhes do fiscal *apenas se* um ID for selecionado na URL
  const fiscalDetails = userId ? await getFiscalDetails(userId) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Gestão de Equipe
          </CardTitle>
          <CardDescription>
            Selecione um fiscal para visualizar e gerenciar suas vias de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EquipeClientPage
            fiscaisList={fiscaisList}
            viasList={viasList}
            fiscalDetails={fiscalDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
}