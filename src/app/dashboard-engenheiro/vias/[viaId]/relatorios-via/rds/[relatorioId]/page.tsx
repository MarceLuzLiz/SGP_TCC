import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileSpreadsheet } from 'lucide-react';
import { RelatorioPhotoGrid } from '@/app/dashboard/_components/RelatorioPhotoGrid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DownloadConsolidadoRdsButton } from '@/components/pdf/DownloadConsolidadoRdsButton';

const prisma = new PrismaClient();

// Interface para os dados JSON do RDS
interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

// Função de busca (a mesma do RFT, mas agora processa o JSON)
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

  // Achata a lista de fotos
  const allFotos = relatorio.itens.flatMap(item => 
    item.relatorioOrigem.fotos.map(fotoItem => fotoItem.foto)
  );

  // Agrega os dados JSON de todos os relatórios de trecho
  const allDadosRDS: (DadosRDS & { trechoNome: string })[] = [];
  relatorio.itens.forEach(item => {
    if (item.relatorioOrigem.dadosJson) {
      const dados: DadosRDS = JSON.parse(item.relatorioOrigem.dadosJson);
      allDadosRDS.push({
        ...dados,
        trechoNome: item.relatorioOrigem.trecho.nome,
      });
    }
  });

  return { relatorio, allFotos, allDadosRDS };
}

export default async function RDSConsolidadoPage({ params }: { params: Promise<{ viaId: string, relatorioId: string }> }) {
  const { viaId, relatorioId } = await params;
  const data = await getConsolidadoDetails(relatorioId);

  if (!data || data.relatorio.tipo !== 'RDS_VIA') notFound();

  const { relatorio, allFotos, allDadosRDS } = data;

  const trechosParaPdf = relatorio.itens.map(item => {
    const json = item.relatorioOrigem.dadosJson ? JSON.parse(item.relatorioOrigem.dadosJson) : {};
    return {
      nome: item.relatorioOrigem.trecho.nome,
      kmInicial: item.relatorioOrigem.trecho.kmInicial,
      kmFinal: item.relatorioOrigem.trecho.kmFinal,
      dataVistoria: item.relatorioOrigem.vistoria.dataVistoria,
      fotos: item.relatorioOrigem.fotos.map(f => f.foto),
      dadosRDS: json // Passa o JSON do RDS deste trecho
    };
  });

  const dadosPDF = {
    titulo: relatorio.titulo,
    viaNome: relatorio.via.name,
    dataGeracao: relatorio.createdAt,
    criadoPor: relatorio.criadoPor.name,
    trechos: trechosParaPdf
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm text-gray-500">
        <Link href={`/dashboard-engenheiro/vias/${viaId}`} className="hover:underline">{relatorio.via.name}</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link href={`/dashboard-engenheiro/vias/${viaId}/relatorios-via/rds`} className="hover:underline">RDSs da Via</Link>
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

      <DownloadConsolidadoRdsButton 
             dados={dadosPDF} 
             fileName={`RDS_Consolidado_${relatorio.via.name}.pdf`} 
          />
      
      {/* Detalhes Consolidados do RDS */}
      <Card>
        <CardHeader>
          <CardTitle>Informações de Serviço Consolidadas</CardTitle>
          <CardDescription>
            Anotações e ocorrências de todos os relatórios de trecho incluídos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {allDadosRDS.map((dados, index) => (
            <div key={index} className="border-b pb-4">
              <h3 className="font-semibold text-primary">{dados.trechoNome}</h3>
              <div className="grid grid-cols-3 gap-4 text-sm mt-2">
                <div><span className="font-semibold block text-gray-500">Clima</span>{dados.clima || 'N/A'}</div>
                <div><span className="font-semibold block text-gray-500">Entrada</span>{dados.horarioEntrada || 'N/A'}</div>
                <div><span className="font-semibold block text-gray-500">Saída</span>{dados.horarioSaida || 'N/A'}</div>
              </div>
              <div className="text-sm mt-3">
                <span className="font-semibold block text-gray-500">Anotações</span>
                <p className="mt-1 whitespace-pre-wrap">{dados.anotacoes || 'Nenhuma.'}</p>
              </div>
              <div className="text-sm mt-3">
                <span className="font-semibold block text-gray-500">Ocorrências</span>
                <p className="mt-1 whitespace-pre-wrap">{dados.ocorrencias || 'Nenhuma.'}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Galeria de Fotos Consolidada */}
      {allFotos.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">Galeria de Fotos Consolidada</h2>
          <RelatorioPhotoGrid fotos={allFotos} />
        </>
      )}
    </div>
  );
}