import { Prisma, PrismaClient, TipoRelatorioVia } from '@prisma/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, PieChart } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RelatorioViaFiltro } from '../_components/RelatorioViaFiltro';
import { DeleteRelatorioViaButton } from '../_components/DeleteRelatorioViaButton';
import { DownloadGerencialButton } from '@/components/pdf/SmartPdfButtons';

const prisma = new PrismaClient();

export default async function GerencialViaListPage({
  params,
  searchParams,
}: {
  params: Promise<{ viaId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>; // 2. Aceitar
}) {
  const { viaId } = await params;
  const { from, to } = await searchParams; // 3. Ler

  const via = await prisma.via.findUnique({
    where: { id: viaId },
    select: { id: true, name: true },
  });

  if (!via) notFound();

  // 4. Criar o 'where' para o filtro
  const where: Prisma.RelatorioViaWhereInput = {
    viaId: viaId,
    tipo: TipoRelatorioVia.GERENCIAL_VIA,
  };
  if (from || to) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (from) dateFilter.gte = new Date(from);
    if (to) {
      const endDate = new Date(to);
      endDate.setDate(endDate.getDate() + 1);
      dateFilter.lt = endDate;
    }
    where.dataReferencia = dateFilter; // Filtra pela data de referência
  }

  const relatorios = await prisma.relatorioVia.findMany({
    where, // 5. Aplicar o filtro
    orderBy: { createdAt: 'desc' },
  });
 
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Gerenciais</h1>
          <p className="text-muted-foreground">Via: {via.name}</p>
        </div>
        <Button asChild>
          <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/gerencial/novo`}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Gerar Novo Relatório
          </Link>
        </Button>
      </div>

      {/* 6. Adicionar o componente de filtro */}
      <RelatorioViaFiltro />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatorios.length === 0 && (
          <p className="text-muted-foreground col-span-full">Nenhum relatório gerencial criado.</p>
        )}
        {relatorios.map(rel => (
          <Card key={rel.id} className="hover:border-primary transition-colors relative">
            <div className="absolute top-2 right-2 z-10">
              <DeleteRelatorioViaButton relatorioViaId={rel.id} viaId={via.id} />
            </div>
            <div className="absolute top-2 right-10 z-10">
              <DownloadGerencialButton id={rel.id} />
            </div>
            <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/gerencial/${rel.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  {rel.titulo}
                </CardTitle>
                <CardDescription>
                  Ref: {new Date(rel.dataReferencia).toLocaleDateString('pt-BR')}
                </CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}