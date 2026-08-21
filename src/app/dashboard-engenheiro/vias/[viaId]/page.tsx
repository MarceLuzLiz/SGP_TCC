import Link from 'next/link';
import { getViaDetails } from '@/lib/data/engenheiro';
import { notFound } from 'next/navigation';
import {
  ChevronLeft,
  MapPin,
  Route,
  BarChart3,
  PieChart,
  FileSpreadsheet,
  FileText,
  Flame,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ViaDetailMap } from './_components/via-detail-map';
import { IggDisplay } from '@/app/dashboard-engenheiro/trechos/[trechoId]/_components/igg-display';
import { Button } from '@/components/ui/button';
import { RequestExclusionDialog } from './_components/RequestExclusionDialog';
import { EditViaDialog } from './_components/EditViaDialog';
import { EditTrechoDialog } from './_components/EditTrechoDialog';

type Coordenada = { lat: number; lng: number };

export const dynamic = 'force-dynamic';

export default async function ViaDetailPage(
  context: { params: Promise<{ viaId: string }> }
) {
  const params = await context.params;
  const via = await getViaDetails(params.viaId);

  if (!via) {
    notFound();
  }

  let trajetoCoords: Coordenada[] | null = null;
  if (via.trajetoJson && Array.isArray(via.trajetoJson)) {
    trajetoCoords = via.trajetoJson as Coordenada[];
  }

  const allFotos = via.trechos.flatMap((trecho) => trecho.fotos);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard-engenheiro/vias"
        className="flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Voltar para Vias
      </Link>

      {/* AVISO DE VIA SUSPENSA */}
      {via.isSuspended && (
        <div className="rounded-lg border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 dark:text-amber-300">
                Via Suspensa — Aguardando Decisão do Administrador
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                {via.motivoSuspensao || 'Exclusão solicitada por um Engenheiro.'}
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-1">
                Os dados históricos continuam preservados. Esta via está oculta para novos registros em campo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold">{via.name}</h1>
            {via.isSuspended && (
              <Badge variant="destructive" className="bg-amber-600">
                Suspensão Pendente
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            <span>
              {via.bairro}, {via.municipio} - {via.estado} - Extensão: {via.extensaoKm.toFixed(2)} km |{' '}
            </span>
            <span className="font-medium text-foreground">
              Nº de Estacas: {via.estacas}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <EditViaDialog via={via} />

          <Button asChild variant="outline" className="gap-2">
            <Link href={`/dashboard-engenheiro/vias/${via.id}/mapa-calor`}>
              <Flame className="h-4 w-4 text-orange-500" />
              Mapa de Calor
            </Link>
          </Button>

          {!via.isSuspended && (
            <RequestExclusionDialog
              type="via"
              id={via.id}
              name={via.name}
              triggerLabel="Solicitar Exclusão"
              buttonVariant="outline"
            />
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna do Mapa */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Mapa Interativo e Criação de Trechos
              </CardTitle>
              <CardDescription>
                Arraste o slider abaixo do mapa para definir o ponto final do novo trecho.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ViaDetailMap
                viaId={via.id}
                trajeto={trajetoCoords}
                fotos={allFotos}
                trechosExistentes={via.trechos}
                viaExtensaoKm={via.extensaoKm}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card IGG da Via */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                IGG da Via (Soma dos Trechos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IggDisplay igg={via.igg} />
            </CardContent>
          </Card>

          {/* Lista de Trechos com Edição e Exclusão */}
          <Card>
            <CardHeader>
              <CardTitle>Trechos da Via</CardTitle>
              <CardDescription>
                Trechos cadastrados ({via.trechos.length})
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {via.trechos.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Nenhum trecho cadastrado. Use o mapa para criar.
                </p>
              )}
              {via.trechos.map((trecho) => (
                <div
                  key={trecho.id}
                  className={`group rounded-xl border p-3.5 transition-all duration-200 bg-white dark:bg-slate-900 ${
                    trecho.isSuspended
                      ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                      : 'border-slate-200/90 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      href={`/dashboard-engenheiro/trechos/${trecho.id}`}
                      className="flex-1 font-semibold text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors flex items-center gap-2"
                    >
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: trecho.cor }}
                      />
                      {trecho.nome}
                    </Link>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <EditTrechoDialog trecho={trecho} showIconOnly={true} />

                      {trecho.isSuspended ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-400 text-xs">
                          Suspenso
                        </Badge>
                      ) : (
                        <RequestExclusionDialog
                          type="trecho"
                          id={trecho.id}
                          name={trecho.nome}
                          showIconOnly
                          buttonVariant="ghost"
                          buttonSize="icon"
                        />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-1">
                    Km {trecho.kmInicial.toFixed(2)} ao Km {trecho.kmFinal.toFixed(2)}
                  </p>

                  {trecho.isSuspended && trecho.motivoSuspensao && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 italic">
                      Motivo: {trecho.motivoSuspensao}
                    </p>
                  )}

                  <div className="mt-2 pt-2 border-t flex justify-between items-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      IGG (Recente):
                    </span>
                    <span className="text-sm font-bold" style={{ color: trecho.cor }}>
                      {trecho.igg.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Relatórios da Via */}
      <div className="lg:col-span-3">
        <h2 className="text-xl font-bold mb-4">Relatórios da Via</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/dashboard-engenheiro/vias/${via.id}/relatorios-via/rft`}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RFT da Via</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RFT</div>
                <p className="text-xs text-muted-foreground">
                  Consolidado fotográfico de todos os trechos.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard-engenheiro/vias/${via.id}/relatorios-via/rds`}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">RDS da Via</CardTitle>
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RDS</div>
                <p className="text-xs text-muted-foreground">
                  Diário de obras unificado da via.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/dashboard-engenheiro/vias/${via.id}/relatorios-via/gerencial`}>
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatório Gerencial</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">IGG & Stats</div>
                <p className="text-xs text-muted-foreground">
                  Cálculo de IGG e tabelas quantitativas.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}