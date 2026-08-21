import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getTrechoDetails } from '@/lib/data/engenheiro';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, CheckSquare, BarChart3, Images, History, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrechoDetailMap } from './_components/trecho-detail-map';
import { IggDisplay } from './_components/igg-display';
import { TrechoApprovalList } from './_components/trecho-approval-list';
import { HistoricoVistorias } from './_components/historico-vistorias';
import { GraficoEvolucao } from './_components/grafico-evolucao';
import { getIggHistoryForTrecho } from '@/lib/utils/igg';
import { IggGeneratorCard } from './_components/IggGeneratorCard';
import { EditTrechoDialog } from '@/app/dashboard-engenheiro/vias/[viaId]/_components/EditTrechoDialog';
import { RequestExclusionDialog } from '@/app/dashboard-engenheiro/vias/[viaId]/_components/RequestExclusionDialog';

export const dynamic = 'force-dynamic';

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

  const relatoriosPendentes = trecho.relatorios.filter(
    (r) => r.statusAprovacao === 'PENDENTE' || r.statusAprovacao === 'CORRIGIDO'
  );

  let trajetoCoords: Coordenada[] | null = null;
  if (trecho.via.trajetoJson && Array.isArray(trecho.via.trajetoJson)) {
    trajetoCoords = trecho.via.trajetoJson as Coordenada[];
  }

  const metrosInicial = Math.round(trecho.kmInicial * 1000);
  const metrosFinal = Math.round(trecho.kmFinal * 1000);

  const startStakeNum = Math.floor(metrosInicial / 20);
  const startStakeRem = metrosInicial % 20;
  const startStakeStr = startStakeRem > 0 ? `E${startStakeNum}+${startStakeRem}m` : `E${startStakeNum}`;

  const endStakeNum = Math.floor(metrosFinal / 20);
  const endStakeRem = metrosFinal % 20;
  const endStakeStr = endStakeRem > 0 ? `E${endStakeNum}+${endStakeRem}m` : `E${endStakeNum}`;

  const qtdEstacas = Math.max(1, endStakeNum - startStakeNum);
  const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);

  const iggHistory = await getIggHistoryForTrecho(params.trechoId);

  return (
    <div className="space-y-6">
      <Link
        href={`/dashboard-engenheiro/vias/${trecho.via.id}`}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para {trecho.via.name}
      </Link>

      {/* AVISO DE TRECHO SUSPENSO */}
      {trecho.isSuspended && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Trecho Suspenso — Aguardando Decisão do Administrador
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {trecho.motivoSuspensao || 'Exclusão solicitada por um Engenheiro.'}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-1">
                Os dados históricos e relatórios continuam preservados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span
              className="h-4 w-4 rounded-full shrink-0"
              style={{ backgroundColor: trecho.cor }}
            />
            <h1 className="text-3xl font-bold">{trecho.nome}</h1>
            {trecho.isSuspended && (
              <Badge variant="destructive" className="bg-amber-600">
                Suspensão Pendente
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1 flex-wrap">
            <span>
              Km {trecho.kmInicial.toFixed(3)} ao Km {trecho.kmFinal.toFixed(3)}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            <span>
              {extensaoKm.toFixed(3)} km
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            <span className="font-medium text-foreground">
              Estaqueamento: {startStakeStr} a {endStakeStr} ({qtdEstacas} {qtdEstacas === 1 ? 'Estaca' : 'Estacas'})
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EditTrechoDialog
            trecho={trecho}
            showIconOnly={false}
            triggerVariant="outline"
          />

          {!trecho.isSuspended && (
            <RequestExclusionDialog
              type="trecho"
              id={trecho.id}
              name={trecho.nome}
              triggerLabel="Solicitar Exclusão"
              buttonVariant="outline"
            />
          )}
        </div>
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
                trajeto={trajetoCoords}
                kmInicial={trecho.kmInicial}
                kmFinal={trecho.kmFinal}
                cor={trecho.cor}
                fotos={trecho.fotos}
              />
            </CardContent>
          </Card>

          {/* Fila de Aprovação Rápida */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-primary" />
                Relatórios Pendentes de Aprovação ({relatoriosPendentes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TrechoApprovalList relatorios={relatoriosPendentes} />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita: IGG e Abas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de IGG Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                IGG Atual do Trecho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IggDisplay igg={trecho.igg} />
            </CardContent>
          </Card>

          {/* Card para Forçar Emissão de Relatório */}
          <IggGeneratorCard trechoId={trecho.id} vistorias={vistoriasFormatadas} />

          {/* Abas com Histórico e Gráficos */}
          <Tabs defaultValue="historico" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="historico">
                <History className="mr-2 h-4 w-4" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="grafico">
                <Images className="mr-2 h-4 w-4" />
                Evolução IGG
              </TabsTrigger>
            </TabsList>
            <TabsContent value="historico">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Vistorias</CardTitle>
                </CardHeader>
                <CardContent>
                  <HistoricoVistorias vistorias={trecho.vistorias} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="grafico">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução do IGG</CardTitle>
                </CardHeader>
                <CardContent>
                  <GraficoEvolucao data={iggHistory} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}