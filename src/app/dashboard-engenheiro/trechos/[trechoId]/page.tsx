import Link from 'next/link';
import { getTrechoDetails } from '@/lib/data/engenheiro';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, CheckSquare, BarChart3, Images, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrechoDetailMap } from './_components/trecho-detail-map';
import { IggDisplay } from './_components/igg-display';
import { TrechoApprovalList } from './_components/trecho-approval-list';
import { HistoricoVistorias } from './_components/historico-vistorias';
import { GraficoEvolucao } from './_components/grafico-evolucao';
import { Button } from '@/components/ui/button';
import { PrismaClient } from '@prisma/client';
import { IggGeneratorCard } from './_components/IggGeneratorCard';


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

// 1. CORREÇÃO: Definir o tipo Coordenada para validação
type Coordenada = { lat: number; lng: number };

export default async function TrechoDetailPage(
  context: { params: Promise<{ trechoId: string }> }
) {
  const params = await context.params;
  const trecho = await getTrechoDetails(params.trechoId);

  if (!trecho) {
    notFound();
  }

  const vistoriasValidas = await prisma.vistoria.findMany({
    where: {
      trechoId: params.trechoId,
      relatorios: {
        some: { tipo: 'RFT', statusAprovacao: 'APROVADO' }
      }
    },
    select: { id: true, dataVistoria: true },
    orderBy: { dataVistoria: 'desc' }
  });

  const vistoriasFormatadas = vistoriasValidas.map(v => ({
    id: v.id,
    data: v.dataVistoria
  }));

  // 2. CORREÇÃO: Remover a variável 'fotosRFT' não utilizada
  // const fotosRFT = trecho.fotos.filter(f => f.tipo === 'RFT');

  // Filtra os relatórios pendentes para a fila de aprovação
  const relatoriosPendentes = trecho.relatorios.filter(
    (r) => r.statusAprovacao === 'PENDENTE' || r.statusAprovacao === 'CORRIGIDO'
  );

  // 3. CORREÇÃO: Validar o trajetoJson antes de passar (remove 'as any')
  let trajetoCoords: Coordenada[] | null = null;
  if (trecho.via.trajetoJson && Array.isArray(trecho.via.trajetoJson)) {
    trajetoCoords = trecho.via.trajetoJson as Coordenada[];
  }

  const metrosInicial = trecho.kmInicial * 1000;
  const metrosFinal = trecho.kmFinal * 1000;

  
  
  // Regra do Estaqueamento Global: Quantas estações inteiras cabem no intervalo
  let qtdEstacoes = Math.floor(metrosFinal / 20) - Math.floor(metrosInicial / 20);
  
  
  // Garante que mostre pelo menos 1 se for muito pequeno (embora raro)
  if (qtdEstacoes <= 0) qtdEstacoes = 1;

  const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);

  

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard-engenheiro/vias/${trecho.via.id}`}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para {trecho.via.name}
      </Link>

      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">{trecho.nome}</h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <span>
            Km {trecho.kmInicial.toFixed(3)} ao Km {trecho.kmFinal.toFixed(3)}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-400" /> {/* Separador visual (bolinha) */}
          <span>
             {extensaoKm.toFixed(3)} km |
          </span>
          <span className="font-medium text-foreground">
             {qtdEstacoes} {qtdEstacoes === 1 ? 'Estação' : 'Estações'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Mapa e Fila de Aprovação */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mapa do Trecho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Mapa do Trecho
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TrechoDetailMap
                trajeto={trajetoCoords} // 4. CORREÇÃO: Passa a variável validada
                kmInicial={trecho.kmInicial}
                kmFinal={trecho.kmFinal}
                cor={trecho.cor}
                fotos={trecho.fotos}
              />
            </CardContent>
          </Card>

          {/* Fila de Aprovação do Trecho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-primary" />
                Fila de Aprovação do Trecho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrechoApprovalList relatorios={relatoriosPendentes} />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: Dashboards e Abas */}
        <div className="lg:col-span-1 space-y-6">
          {/* IGG */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                IGG do Trecho (Vistoria Recente)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IggDisplay igg={trecho.igg} n={qtdEstacoes}/>
            </CardContent>
          </Card>

          <IggGeneratorCard 
            trechoId={trecho.id} 
            vistorias={vistoriasFormatadas} 
          />
          
          {/* TODO: Gráfico de Evolução */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Evolução do IGG
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GraficoEvolucao data={trecho.iggHistory} />
          </CardContent>
        </Card>

          {/* Abas de Dados */}
          <Tabs defaultValue="vistorias"> {/* Mudar o padrão para 'vistorias' */}
          <TabsList className="grid w-full grid-cols-2">
            
            {/* 1. MUDANÇA: 'TabsTrigger' para 'Link' (disfarçado de botão) */}
            <Button variant="ghost" asChild className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none">
              <Link href={`/dashboard-engenheiro/trechos/${trecho.id}/galeria`}>
                <Images className="mr-2 h-4 w-4" /> Galeria Completa
              </Link>
            </Button>
            
            <TabsTrigger value="vistorias">
              <History className="mr-2 h-4 w-4" /> Vistorias
            </TabsTrigger>
          </TabsList>
          
          {/* 2. REMOÇÃO: O <TabsContent value="galeria"> foi removido */}
          
          <TabsContent value="vistorias" className="mt-4">
            <Card>
              <CardHeader><CardTitle>Histórico de Vistorias</CardTitle></CardHeader>
              <CardContent>
                <HistoricoVistorias vistorias={trecho.vistorias} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        </div>
      </div>
    </div>
  );
}