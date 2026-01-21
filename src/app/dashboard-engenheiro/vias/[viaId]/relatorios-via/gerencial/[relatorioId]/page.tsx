import { Foto, Patologia, PrismaClient, RdsOcorrencia } from '@prisma/client';
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
import { DownloadGerencialPdfButton } from '@/components/pdf/DownloadGerencialPdfButton'; // <-- IMPORTAR
import { formatKmToStakes } from '@/lib/formatters';

const prisma = new PrismaClient();

type FotoCompleta = Foto & { 
  patologia: Patologia | null; 
  rdsOcorrencia: RdsOcorrencia | null 
};

// --- 1. DEFINIÇÃO DOS TIPOS (Substitui o 'any') ---
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

// Este é o tipo que a nossa função 'gerarDadosGerenciais' cria
interface DadosGerenciais {
  iggTotal: number;
  tabelaPatologias: TabelaPatologiaRow[];
  tabelaCalculo: TabelaCalculoRow[];
  viaName: string; // <-- ADD
  totalTrechos: number; // <-- ADD
  viaEstacas: string | null; // <-- ADD
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
// --- FIM DA DEFINIÇÃO DOS TIPOS ---

export default async function DetalheGerencialPage({
  params,
}: {
  params: Promise<{ relatorioId: string }>;
}) {
  const { relatorioId } = await params;

  const relatorio = await prisma.relatorioVia.findUnique({
    where: { id: relatorioId },
    include: {
      criadoPor: { select: { name: true } }, // <-- 1. BUSCAR
    }
  });

  if (!relatorio || !relatorio.dadosJson) {
    notFound();
  }

  // --- 2. TIPAGEM FORTE (Substitui o 'any') ---
  // Fazemos o cast do JSON.parse para a nossa interface
  const dados: DadosGerenciais = JSON.parse(relatorio.dadosJson);

  return (
    <div className="space-y-8">
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
      <div className="p-6 border rounded-lg bg-slate-50">
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
            
            {/* IGG Total (Movido para cá) */}
            <div className="text-center mt-6 border-t pt-6">
              <h3 className="font-semibold mb-2">IGG DA VIA (Referência)</h3>
              <IggDisplay igg={dados.iggTotal} />
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TABELA 1: QUANTITATIVO */}
        <div className="border rounded-lg p-4">
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
              {/* --- 3. TIPAGEM INFERIDA (Remove o 'any') --- */}
              {dados.tabelaPatologias.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {row.nome}{' '}
                    <span className="text-xs text-gray-400">({row.codigo})</span>
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
        <div className="border rounded-lg p-4">
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
              {/* --- 4. TIPAGEM INFERIDA (Remove o 'any') --- */}
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