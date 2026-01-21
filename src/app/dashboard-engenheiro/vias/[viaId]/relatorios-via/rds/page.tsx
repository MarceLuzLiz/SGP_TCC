import { Prisma, PrismaClient, TipoRelatorioVia } from '@prisma/client'; // 1. Importar Prisma
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import { RelatorioViaFiltro } from '../_components/RelatorioViaFiltro';
import { DeleteRelatorioViaButton } from '../_components/DeleteRelatorioViaButton';
import { DownloadConsolidadoViaButton } from '@/components/pdf/SmartPdfButtons';

const prisma = new PrismaClient();

export default async function RdsViaListPage({
  params,
  searchParams, // 3. Aceitar searchParams
}: {
  params: Promise<{ viaId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>; // 3. Aceitar searchParams
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
    where.createdAt = dateFilter; // Filtra pela data de criação
  }

  const relatorios = await prisma.relatorioVia.findMany({
    where, // 6. Usar 'where'
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
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
          // Link para a página de detalhes (que ainda não criámos, mas podemos reutilizar a lógica)
          <Card key={rel.id} className="hover:border-primary transition-colors relative">
            <div className="absolute top-2 right-2 z-10">
              <DeleteRelatorioViaButton relatorioViaId={rel.id} viaId={via.id} />
            </div>
            {/* --- ADIÇÃO: Botão de Download --- */}
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