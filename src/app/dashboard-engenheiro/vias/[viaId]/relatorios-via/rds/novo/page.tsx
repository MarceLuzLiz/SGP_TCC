import prisma from '@/lib/prisma';
import { StatusAprovacao, RelatorioTipo } from '@prisma/client';
import { notFound } from 'next/navigation';
import { CreateConsolidadoForm } from '@/app/dashboard-engenheiro/vias/[viaId]/relatorios-via/rft/novo/_components/create-consolidado-form';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

// Busca os dados necessários, filtrando por RDS
async function getDadosParaFormulario(viaId: string) {
  const trechos = await prisma.trecho.findMany({
    where: { viaId: viaId },
    select: {
      id: true,
      nome: true,
      relatorios: {
        where: {
          tipo: RelatorioTipo.RDS,
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

  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: { id: true, name: true },
  });

  if (!via) notFound();

  const trechosComRelatorios = await getDadosParaFormulario(viaId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'Vias & Trechos', href: '/dashboard-engenheiro/vias' },
          { label: via.name, href: `/dashboard-engenheiro/vias/${viaId}` },
          { label: 'RDSs da Via', href: `/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds` },
          { label: 'Novo RDS Consolidado' },
        ]}
        backHref={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds`}
        backLabel="Voltar para Lista"
      />

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
        tipoConsolidado="RDS_VIA"
      />
    </div>
  );
}