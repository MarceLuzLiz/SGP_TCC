import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { FileText } from 'lucide-react';
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DownloadConsolidadoRftButton } from '@/components/pdf/DownloadConsolidadoRftButton';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

// Função de busca para este relatório
async function getConsolidadoDetails(relatorioViaId: string) {
  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioViaId },
    include: {
      via: true,
      criadoPor: { select: { name: true } },
      itens: {
        include: {
          relatorioOrigem: {
            include: {
              trecho: true,
              vistoria: true,
              fotos: {
                include: {
                  foto: {
                    include: {
                      patologia: true,
                      rdsOcorrencia: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          relatorioOrigem: { trecho: { kmInicial: 'asc' } },
        },
      },
    },
  });

  if (!relatorio) return null;

  const allFotos = relatorio.itens.flatMap(item => 
    item.relatorioOrigem.fotos.map(fotoItem => fotoItem.foto)
  );

  return { relatorio, allFotos };
}

export default async function RFTConsolidadoPage({ params }: { params: Promise<{ viaId: string, relatorioId: string }> }) {
  const { viaId, relatorioId } = await params;
  const data = await getConsolidadoDetails(relatorioId);

  if (!data || data.relatorio.tipo !== 'RFT_VIA') notFound();

  const { relatorio, allFotos } = data;

  const trechosParaPdf = relatorio.itens.map(item => ({
    nome: item.relatorioOrigem.trecho.nome,
    kmInicial: item.relatorioOrigem.trecho.kmInicial,
    kmFinal: item.relatorioOrigem.trecho.kmFinal,
    dataVistoria: item.relatorioOrigem.vistoria.dataVistoria,
    fotos: item.relatorioOrigem.fotos.map(f => f.foto)
  }));

  const dadosPDF = {
    titulo: relatorio.titulo,
    viaNome: relatorio.via.name,
    dataGeracao: relatorio.createdAt,
    criadoPor: relatorio.criadoPor.name,
    trechos: trechosParaPdf
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav
        items={[
          { label: 'Vias & Trechos', href: '/dashboard-engenheiro/vias' },
          { label: relatorio.via.name, href: `/dashboard-engenheiro/vias/${viaId}` },
          { label: 'RFTs da Via', href: `/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft` },
          { label: relatorio.titulo || 'Detalhes' },
        ]}
        backHref={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft`}
        backLabel="Voltar para RFTs"
      />

      {/* Cabeçalho */}
      <div className="p-6 bg-white dark:bg-card border rounded-lg shadow-xs mb-8">
        <h1 className="text-2xl font-bold text-foreground">{relatorio.titulo}</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="font-semibold block text-muted-foreground">Via</span>{relatorio.via.name}</div>
          <div><span className="font-semibold block text-muted-foreground">Nº de Relatórios</span>{relatorio.itens.length}</div>
          <div><span className="font-semibold block text-muted-foreground">Data de Criação</span>{new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</div>
          <div><span className="font-semibold block text-muted-foreground">Criado por:</span>{relatorio.criadoPor.name}</div>
          <div><span className="font-semibold block text-muted-foreground">Nº Total de Fotos</span>{allFotos.length}</div>
        </div>
      </div>

      <DownloadConsolidadoRftButton 
         dados={dadosPDF} 
         fileName={`RFT_Consolidado_${relatorio.via.name}.pdf`} 
      />
      
      {/* Lista de Relatórios de Trecho Incluídos */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios de Trecho Incluídos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {relatorio.itens.map(item => (
            <div key={item.id} className="border p-3 rounded-md flex justify-between items-center">
              <div>
                <span className="font-semibold">{item.relatorioOrigem.trecho.nome}</span>
                <p className="text-sm text-muted-foreground">
                  Vistoria de: {new Date(item.relatorioOrigem.vistoria.dataVistoria).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <Badge variant="outline">{item.relatorioOrigem.fotos.length} fotos</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Galeria de Fotos Consolidada */}
      <h2 className="text-xl font-semibold mb-4">Galeria de Fotos Consolidada</h2>
      <RelatorioPhotoGrid fotos={allFotos} />
    </div>
  );
}