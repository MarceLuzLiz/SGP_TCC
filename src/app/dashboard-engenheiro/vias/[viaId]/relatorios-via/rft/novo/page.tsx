import { PrismaClient, StatusAprovacao, RelatorioTipo } from '@prisma/client';
import { notFound } from 'next/navigation';
import { CreateConsolidadoForm } from './_components/create-consolidado-form'; // Criaremos a seguir

const prisma = new PrismaClient();

// Busca os dados necessários para o formulário
async function getDadosParaFormulario(viaId: string) {
  const trechos = await prisma.trecho.findMany({
    where: { viaId: viaId },
    select: {
      id: true,
      nome: true,
      // Busca apenas relatórios RFT Aprovados deste trecho
      relatorios: {
        where: {
          tipo: RelatorioTipo.RFT,
          statusAprovacao: StatusAprovacao.APROVADO,
          // Garante que ele ainda não foi usado em outro consolidado
          itensConsolidados: { none: {} },
        },
        select: {
          id: true,
          vistoria: { select: { dataVistoria: true } },
        },
        orderBy: { vistoria: { dataVistoria: 'desc' } },
      },
    },
    orderBy: { kmInicial: 'asc' },
  });
  return trechos;
}

export default async function NovoRftViaPage({ params }: { params: Promise<{ viaId: string }> }) {
  const { viaId } = await params;
  const trechosComRelatorios = await getDadosParaFormulario(viaId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Novo RFT Consolidado da Via</h1>
        <p className="text-muted-foreground">
          Selecione os relatórios RFT (Aprovados) de cada trecho que você deseja
          incluir nesta compilação.
        </p>
      </div>
      <CreateConsolidadoForm
        viaId={viaId}
        trechos={trechosComRelatorios}
        tipoConsolidado="RFT_VIA"
      />
    </div>
  );
}