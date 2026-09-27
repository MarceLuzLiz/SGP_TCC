import prisma from '@/lib/prisma';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { IggDisplay } from '@/app/dashboard-engenheiro/trechos/[trechoId]/_components/igg-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { notFound } from 'next/navigation';
import { DownloadGerencialPdfButton } from '@/components/pdf/DownloadGerencialPdfButton';
import { formatKmToStakes } from '@/lib/formatters';
import { BreadcrumbNav } from '@/components/navigation/BreadcrumbNav';

type FotoCompleta = Foto & { 
  patologia: Patologia | null; 
  rdsOcorrencia: RdsOcorrencia | null 
};

interface TabelaPatologiaRow {
  nome: string;
  codigo: string;
  quantidade: number;
  trechosAfetados: number;
}

interface TabelaCalculoRow {
  patologia: string;
  fa: number;
  fr: number;
  fp: number;
  igi: number;
}

interface DadosGerenciais {
  iggTotal: number;
  tabelaPatologias: TabelaPatologiaRow[];
  tabelaCalculo: TabelaCalculoRow[];
  viaName: string;
  totalTrechos: number;
  viaEstacas: string | null;
  extensaoKm: number;
  totalPatologias: number;
  fotosPorTrecho: {
    trechoNome: string;
    kmInicial: number;
    kmFinal: number;
    dataVistoria: Date;
    fotos: FotoCompleta[];
  }[];
  totalEstacoesConsideradas: number;
}

export default async function DetalheGerencialPage({
  params,
}: {
  params: Promise<{ viaId: string; relatorioId: string }>;
}) {
  const { viaId, relatorioId } = await params;

  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioId },
    include: {
      criadoPor: { select: { name: true } },
    }
  });

  if (!relatorio || !relatorio.dadosJson) {
    notFound();
  }

  const dados: DadosGerenciais = JSON.parse(relatorio.dadosJson);

  return (
    <div className="space-y-8">
      <BreadcrumbNav
        items={[
          { label: 'Vias & Trechos', href: '/dashboard-engenheiro/vias' },
          { label: dados.viaName || 'Via', href: `/dashboard-engenheiro/vias/${viaId || relatorio.viaId}` },
          { label: 'Relatórios Gerenciais', href: `/dashboard-engenheiro/vias/${viaId || relatorio.viaId}/relatorios-via/gerencial` },
          { label: relatorio.titulo || 'Detalhes' },
        ]}
        backHref={`/dashboard-engenheiro/vias/${viaId || relatorio.viaId}/relatorios-via/gerencial`}
        backLabel="Voltar para Lista"
      />

      <div>
        <h1 className="text-3xl font-bold">{relatorio.titulo}</h1>
        <p className="text-muted-foreground">
          Referência: {new Date(relatorio.dataReferencia).toLocaleDateString('pt-BR')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Gerado por: {relatorio.criadoPor.name}
        </p>
      </div>

      <DownloadGerencialPdfButton 
        dados={dados}
        titulo={relatorio.titulo}
        dataGeracao={relatorio.createdAt}
        criadoPor={relatorio.criadoPor.name}
        fileName={`Gerencial_${dados.viaName}.pdf`}
      />

      {/* IGG TOTAL */}
      <div className="p-6 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Col 1: Info da Via */}
          <div className="md:col-span-2 space-y-2">
            <h3 className="text-xl font-bold text-primary">{dados.viaName}</h3>
            <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
              <span>{dados.totalTrechos} trecho(s)</span>
              <span>Extensão: {dados.extensaoKm.toFixed(2)} km</span>
              <span>Nº de Estacas: {formatKmToStakes(dados.extensaoKm)}</span>
            </div>
          </div>

          <div className="space-y-1 text-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Estações (n)</span>
            <p className="text-xl font-semibold text-foreground">
              {dados.totalEstacoesConsideradas}
            </p>
          </div>
          
          {/* Col 2: Info de Patologias */}
          <div className="text-left md:text-right">
            <div>
              <span className="text-sm font-medium text-muted-foreground">Total de Patologias (Fa)</span>
              <p className="text-3xl font-bold">{dados.totalPatologias}</p>
            </div>
          </div>
        </div>
        
        {/* IGG Total */}
        <div className="text-center mt-6 border-t pt-6">
          <h3 className="font-semibold mb-2">IGG DA VIA (Referência)</h3>
          <IggDisplay igg={dados.iggTotal} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TABELA 1: QUANTITATIVO */}
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-bold mb-4 text-lg">Quantitativo de Patologias</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patologia</TableHead>
                <TableHead className="text-right">Qtd (Fa)</TableHead>
                <TableHead className="text-right">Trechos Afetados</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.tabelaPatologias.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {row.nome}{' '}
                    <span className="text-xs text-muted-foreground">({row.codigo})</span>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.quantidade}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.trechosAfetados}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* TABELA 2: MEMÓRIA DE CÁLCULO */}
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-bold mb-4 text-lg">Memória de Cálculo do IGG</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patologia</TableHead>
                <TableHead className="text-right">Fr (%)</TableHead>
                <TableHead className="text-right">Fator (Fp)</TableHead>
                <TableHead className="text-right">IGI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.tabelaCalculo.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.patologia}</TableCell>
                  <TableCell className="text-right">{row.fr}</TableCell>
                  <TableCell className="text-right">{row.fp}</TableCell>
                  <TableCell className="text-right font-bold">
                    {row.igi}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}