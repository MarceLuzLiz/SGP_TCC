import Link from 'next/link';
import { getViaDetails } from '@/lib/data/engenheiro';
import { notFound } from 'next/navigation';
import { ChevronLeft, MapPin, Route, BarChart3, PieChart, FileSpreadsheet, FileText, Flame } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ViaDetailMap } from './_components/via-detail-map';
import { IggDisplay } from '@/app/dashboard-engenheiro/trechos/[trechoId]/_components/igg-display';
import { Button } from '@/components/ui/button';
// REMOVA a importação do CreateTrechoForm

type Coordenada = { lat: number; lng: number };

export const dynamic = 'force-dynamic';

export default async function ViaDetailPage(
  context: { params: Promise<{ viaId: string }> }
) {
  
  // <<< MUDANÇA 3: Usamos 'await' para obter os 'params' de dentro do 'context' >>>
  const params = await context.params;
  const via = await getViaDetails(params.viaId); // 

  if (!via) {
    notFound(); // 
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

      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold">{via.name}</h1>
        <p className="text-muted-foreground">
          <span>
          {via.bairro}, {via.municipio} - {via.estado} - Extensão: {via.extensaoKm.toFixed(2)} km |
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-400" /> {/* Separador visual (bolinha) */}
          <span className="font-medium text-foreground">
            Nº de Estacas: {via.estacas}
          </span>
        </p>
      </div>
      <Button asChild variant="outline" className="gap-2">
          <Link href={`/dashboard-engenheiro/vias/${via.id}/mapa-calor`}>
            <Flame className="h-4 w-4 text-orange-500" />
            Mapa de Calor
          </Link>
        </Button>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna do Mapa (AGORA INTERATIVO) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-primary" />
                Mapa Interativo e Criação de Trechos
              </CardTitle>
              <CardDescription>
                Arraste o slider abaixo do mapa para definir o ponto final do
                novo trecho.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Note que o CardContent agora tem p-0 para o mapa se ajustar */}
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
        

        

        {/* Coluna de Trechos (AGORA APENAS LISTA) */}
        <div className="lg:col-span-1 space-y-6">
          {/* 3. ADICIONADO CARD IGG DA VIA */}
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

          {/* 4. ATUALIZADO CARD DE LISTA DE TRECHOS */}
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
                <Link
                  href={`/dashboard-engenheiro/trechos/${trecho.id}`}
                  key={trecho.id}
                  className="block rounded-md border p-4 transition-colors hover:border-primary"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{trecho.nome}</h3>
                    <Route className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Km {trecho.kmInicial.toFixed(2)} ao Km{' '}
                    {trecho.kmFinal.toFixed(2)}
                  </p>
                  {/* EXIBE O IGG INDIVIDUAL DO TRECHO */}
                  <div className="mt-2 pt-2 border-t">
                    <span className="text-xs font-medium text-muted-foreground">
                      IGG (Recente):{' '}
                    </span>
                    <span className="text-sm font-bold" style={{ color: trecho.cor }}>
                      {trecho.igg.toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="lg:col-span-3">
  <h2 className="text-xl font-bold mb-4">Relatórios da Via</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    
    {/* Card RFT Consolidado */}
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

    {/* Card RDS Consolidado */}
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

    {/* Card Gerencial */}
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