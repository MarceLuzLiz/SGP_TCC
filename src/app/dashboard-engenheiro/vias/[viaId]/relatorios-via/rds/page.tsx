import prisma from '@/lib/prisma';
import { Prisma, TipoRelatorioVia } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RelatorioViaFiltro } from '../_components/RelatorioViaFiltro';
import { DeleteRelatorioViaButton } from '../_components/DeleteRelatorioViaButton';
import { DownloadConsolidadoViaButton } from '@/components/pdf/SmartPdfButtons';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

export default async function RdsViaListPage({
  params,
  searchParams,
}: {
  params: Promise<{ viaId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { viaId } = await params;
  const { from, to } = await searchParams;
  
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: { id: true, name: true }
  });

  if (!via) notFound();

  // Busca apenas relatórios do tipo RDS_VIA
  const where: Prisma.RelatorioViaWhereInput = {
    viaId: viaId,
    tipo: TipoRelatorioVia.RDS_VIA,
  };
  if (from || to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter.lt = endDate;
    }
    where.createdAt = dateFilter;
  }

  const relatorios = await prisma.relatorioVia.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'Vias & Trechos', href: '/dashboard-engenheiro/vias' },
          { label: via.name, href: `/dashboard-engenheiro/vias/${viaId}` },
          { label: 'RDSs da Via' },
        ]}
        backHref={`/dashboard-engenheiro/vias/${viaId}`}
        backLabel="Voltar para a Via"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">RDSs Consolidados da Via</h1>
          <p className="text-muted-foreground">Via: {via.name}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds/novo`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Criar Novo RDS da Via
          </Link>
        </Button>
      </div>

      <RelatorioViaFiltro />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatorios.length === 0 && (
          <p className="text-muted-foreground col-span-full">Nenhum RDS consolidado criado.</p>
        )}
        {relatorios.map(rel => (
          <Card key={rel.id} className="hover:border-primary transition-colors relative">
            <div className="absolute top-2 right-2 z-10">
              <DeleteRelatorioViaButton relatorioViaId={rel.id} viaId={via.id} />
            </div>
            <div className="absolute top-2 right-10 z-10">
              <DownloadConsolidadoViaButton id={rel.id} type="RDS_VIA" />
            </div>
            <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds/${rel.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {rel.titulo}
                </CardTitle>
                <CardDescription>
                  Criado em: {new Date(rel.createdAt).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}