import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid'; // Reutilizando
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DownloadConsolidadoRftButton } from '@/components/pdf/DownloadConsolidadoRftButton';

const prisma = new PrismaClient();

// Função de busca para este relatório
async function getConsolidadoDetails(relatorioViaId: string) {
  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioViaId },
    include: {
      via: true,
      criadoPor: { select: { name: true } },
      itens: { // Pega os itens de ligação
        include: {
          relatorioOrigem: { // Pega o relatório de trecho original
            include: {
              trecho: true, // Pega o nome do trecho
              vistoria: true, // Pega a data da vistoria
              fotos: { // Pega os links das fotos do relatório de trecho
                include: {
                  foto: { // Pega os dados da foto
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
          relatorioOrigem: { trecho: { kmInicial: 'asc' } }, // Ordena por trecho
        },
      },
    },
  });

  if (!relatorio) return null;

  // Achata a lista de fotos: [[foto1, foto2], [foto3]] -> [foto1, foto2, foto3]
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
    criadoPor: relatorio.criadoPor.name, // Ou adicionar criador no schema
    trechos: trechosParaPdf
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard-engenheiro/vias/${viaId}`} className="hover:underline">{relatorio.via.name}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rft`} className="hover:underline">RFTs da Via</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="font-semibold text-gray-700">Detalhes</span>
      </nav>

      {/* Cabeçalho */}
      <div className="p-6 bg-white rounded-lg shadow-md mb-8">
        <h1 className="text-2xl font-bold text-gray-800">{relatorio.titulo}</h1>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="font-semibold block text-gray-500">Via</span>{relatorio.via.name}</div>
          <div><span className="font-semibold block text-gray-500">Nº de Relatórios</span>{relatorio.itens.length}</div>
          <div><span className="font-semibold block text-gray-500">Data de Criação</span>{new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</div>
          <div><span className="font-semibold block text-gray-500">Criado por:</span>{relatorio.criadoPor.name}</div>
          <div><span className="font-semibold block text-gray-500">Nº Total de Fotos</span>{allFotos.length}</div>
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