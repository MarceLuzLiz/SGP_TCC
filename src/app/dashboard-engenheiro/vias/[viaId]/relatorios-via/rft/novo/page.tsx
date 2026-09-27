import prisma from '@/lib/prisma';
import { StatusAprovacao, RelatorioTipo } from '@prisma/client';
import { notFound } from 'next/navigation';
import { CreateConsolidadoForm } from './_components/create-consolidado-form';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

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
          { label: 'RFTs da Via', href: `/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft` },
          { label: 'Novo RFT Consolidado' },
        ]}
        backHref={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft`}
        backLabel="Voltar para RFTs"
      />

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