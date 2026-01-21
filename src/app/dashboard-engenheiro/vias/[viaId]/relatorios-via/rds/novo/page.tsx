import { PrismaClient, StatusAprovacao, RelatorioTipo } from '@prisma/client';
import { notFound } from 'next/navigation';
// 1. REUTILIZAR o formulário que já criámos para o RFT
import { CreateConsolidadoForm } from '@/app/dashboard-engenheiro/vias/[viaId]/relatorios-via/rft/novo/_components/create-consolidado-form';

const prisma = new PrismaClient();

// Busca os dados necessários, filtrando por RDS
async function getDadosParaFormulario(viaId: string) {
  const trechos = await prisma.trecho.findMany({
    where: { viaId: viaId },
    select: {
      id: true,
      nome: true,
      // Busca apenas relatórios RDS Aprovados
      relatorios: {
        where: {
          tipo: RelatorioTipo.RDS, // <-- MUDANÇA AQUI
          statusAprovacao: StatusAprovacao.APROVADO,
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

export default async function NovoRdsViaPage({ params }: { params: Promise<{ viaId: string }> }) {
  const { viaId } = await params;
  const trechosComRelatorios = await getDadosParaFormulario(viaId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Novo RDS Consolidado da Via</h1>
        <p className="text-muted-foreground">
          Selecione os relatórios RDS (Aprovados) de cada trecho que você deseja
          incluir nesta compilação.
        </p>
      </div>
      <CreateConsolidadoForm
        viaId={viaId}
        trechos={trechosComRelatorios}
        tipoConsolidado="RDS_VIA" // <-- MUDANÇA AQUI
      />
    </div>
  );
}