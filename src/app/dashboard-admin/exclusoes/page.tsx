import { getSuspendedItems } from '@/lib/actions/admin';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Route, MapPin, Camera, FileText, Calendar } from 'lucide-react';
import { SuspensionActions } from './_components/SuspensionActions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ExclusoesPage() {
  const { suspendedVias, suspendedTrechos } = await getSuspendedItems();

  const totalSuspenso = suspendedVias.length + suspendedTrechos.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Exclusões & Suspensões</h1>
        <p className="text-muted-foreground">
          Vias e Trechos suspensos por solicitação de Engenheiros. Revise as justificativas antes de restaurar ou excluir permanentemente.
        </p>
      </div>

      <Tabs defaultValue="trechos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trechos" className="gap-2">
            <Route className="h-4 w-4" />
            Trechos Suspensos
            {suspendedTrechos.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">
                {suspendedTrechos.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="vias" className="gap-2">
            <MapPin className="h-4 w-4" />
            Vias Suspensas
            {suspendedVias.length > 0 && (
              <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">
                {suspendedVias.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: TRECHOS SUSPENSOS */}
        <TabsContent value="trechos">
          <Card>
            <CardHeader>
              <CardTitle>Trechos com Exclusão Pendente</CardTitle>
              <CardDescription>
                {suspendedTrechos.length === 0
                  ? 'Nenhum trecho está suspenso no momento.'
                  : `${suspendedTrechos.length} trecho(s) aguardando decisão administrativa.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suspendedTrechos.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  ✅ Todos os trechos cadastrados estão em situação regular.
                </div>
              )}

              {suspendedTrechos.map((trecho) => (
                <div
                  key={trecho.id}
                  className="border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 rounded-lg p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{trecho.nome}</h3>
                        <Badge variant="outline" className="text-amber-700 border-amber-400">
                          Km {trecho.kmInicial.toFixed(2)} ao {trecho.kmFinal.toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Via associada:{' '}
                        <Link
                          href={`/dashboard-engenheiro/vias/${trecho.via.id}`}
                          className="font-medium text-foreground hover:underline"
                          target="_blank"
                        >
                          {trecho.via.name}
                        </Link>
                      </p>
                    </div>

                    <SuspensionActions type="trecho" id={trecho.id} name={trecho.nome} />
                  </div>

                  {/* Motivo da Suspensão */}
                  <div className="border-l-4 border-amber-500 bg-background/80 p-3 rounded-r text-sm">
                    <p className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Justificativa do Engenheiro:
                    </p>
                    <p className="text-muted-foreground mt-1 italic">
                      "{trecho.motivoSuspensao || 'Sem justificativa detalhada.'}"
                    </p>
                  </div>

                  {/* Métricas de Impacto / Dados Preservados */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {trecho._count.vistorias} Vistoria(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {trecho._count.relatorios} Relatório(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <Camera className="h-3.5 w-3.5" />
                      {trecho._count.fotos} Foto(s) vinculada(s)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: VIAS SUSPENSAS */}
        <TabsContent value="vias">
          <Card>
            <CardHeader>
              <CardTitle>Vias com Exclusão Pendente</CardTitle>
              <CardDescription>
                {suspendedVias.length === 0
                  ? 'Nenhuma via está suspensa no momento.'
                  : `${suspendedVias.length} via(s) aguardando decisão administrativa.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {suspendedVias.length === 0 && (
                <div className="p-8 text-center text-muted-foreground border border-dashed rounded-lg">
                  ✅ Todas as vias cadastradas estão em situação regular.
                </div>
              )}

              {suspendedVias.map((via) => (
                <div
                  key={via.id}
                  className="border border-red-200 bg-red-50/40 dark:bg-red-950/20 rounded-lg p-5 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{via.name}</h3>
                        <Badge variant="outline" className="text-red-700 border-red-400">
                          {via.extensaoKm.toFixed(2)} km
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {via.bairro}, {via.municipio} - {via.estado} • Estacas: {via.estacas || 'N/A'}
                      </p>
                    </div>

                    <SuspensionActions type="via" id={via.id} name={via.name} />
                  </div>

                  {/* Motivo da Suspensão */}
                  <div className="border-l-4 border-red-500 bg-background/80 p-3 rounded-r text-sm">
                    <p className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      Justificativa do Engenheiro:
                    </p>
                    <p className="text-muted-foreground mt-1 italic">
                      "{via.motivoSuspensao || 'Sem justificativa detalhada.'}"
                    </p>
                  </div>

                  {/* Métricas de Impacto */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <Route className="h-3.5 w-3.5" />
                      {via._count.trechos} Trecho(s) associado(s)
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {via._count.relatoriosVia} Relatório(s) Consolidado(s)
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
