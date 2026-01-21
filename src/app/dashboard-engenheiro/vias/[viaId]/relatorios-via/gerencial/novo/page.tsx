'use client';

import { useState, useTransition, use } from 'react';
import {
  fetchDadosGerenciaisAction,
  createRelatorioGerencial,
} from '@/lib/actions/relatorios-via';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { IggDisplay } from '@/app/dashboard-engenheiro/trechos/[trechoId]/_components/igg-display';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// --- 1. IMPORTAÇÕES DO CALENDÁRIO ---
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatKmToStakes } from '@/lib/formatters';
// --- FIM DAS IMPORTAÇÕES ---

// Tipos para os dados da pré-visualização
interface TabelaPatologiaRow {
  nome: string; codigo: string; quantidade: number; trechosAfetados: number;
}
interface TabelaCalculoRow {
  patologia: string; fa: number; fr: number; fp: number; igi: number;
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
  totalEstacoesConsideradas: number;
}

export default function NovoGerencialPage({
  params,
}: {
  params: Promise<{ viaId: string }>;
}) {
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const router = useRouter();
  
  const [titulo, setTitulo] = useState('');
  // --- 2. ESTADO DO CALENDÁRIO ---
  const [dataRef, setDataRef] = useState<Date | undefined>(new Date());
  
  const [dadosPrevia, setDadosPrevia] = useState<DadosGerenciais | null>(null);

  const resolvedParams = use(params);
  const viaId = resolvedParams.viaId;

  // Ação 1: Gerar a Pré-visualização
  const handleGerarPrevia = () => {
    if (!dataRef || !titulo) {
      toast.error('Preencha o Título e a Data de Referência.');
      return;
    }
    
    // Formata a data para enviar ao servidor
    const dataRefStr = format(dataRef, 'yyyy-MM-dd');

    startGenerate(async () => {
      const result = await fetchDadosGerenciaisAction(viaId, dataRefStr);
      if (result.error) {
        toast.error(result.error);
      } else if (result.data) {
        setDadosPrevia(result.data);
        toast.success('Pré-visualização gerada com sucesso.');
      }
    });
  };

  // Ação 2: Salvar o Relatório
  const handleSalvar = () => {
    if (!dadosPrevia || !dataRef) {
      toast.error('Gere a pré-visualização primeiro.');
      return;
    }
    
    const dataRefStr = format(dataRef, 'yyyy-MM-dd');

    startSave(async () => {
      const result = await createRelatorioGerencial(
        viaId,
        titulo,
        dataRefStr,
        JSON.stringify(dadosPrevia)
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        router.push(`/dashboard-engenheiro/vias/${viaId}/relatorios-via/gerencial`);
      }
    });
  };

  return (
    <div className="space-y-6 mx-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Novo Relatório Gerencial</h1>
        <p className="text-muted-foreground">
          Passo 1: Insira os dados e gere a pré-visualização. Passo 2: Revise e
          salve o relatório.
        </p>
      </div>

      {/* Formulário de Geração */}
      <div className="space-y-4 border p-6 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título do Relatório</Label>
          <Input
            id="titulo"
            placeholder="Ex: Relatório Gerencial - Nov/2025"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            disabled={!!dadosPrevia}
          />
        </div>
        
        {/* --- 3. UI DO CALENDÁRIO SUBSTITUÍDA --- */}
        <div className="space-y-2">
          <Label htmlFor="dataRef">Data de Referência</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start font-normal"
                disabled={!!dadosPrevia}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dataRef ? (
                  format(dataRef, 'PPP', { locale: ptBR })
                ) : (
                  <span>Selecione</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dataRef}
                onSelect={setDataRef}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-muted-foreground">
            O sistema buscará a vistoria de cada trecho mais próxima a esta data.
          </p>
        </div>
        {/* --- FIM DA UI DO CALENDÁRIO --- */}
        
        <Button onClick={handleGerarPrevia} disabled={isGenerating || !!dadosPrevia} className="w-full">
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {dadosPrevia ? 'Pré-visualização Gerada' : '1. Gerar Pré-visualização'}
        </Button>
      </div>

      {/* Pré-visualização (só aparece após gerar) */}
      {dadosPrevia && (
        <div className="space-y-8 mt-8 pt-8 border-t animate-in fade-in-50">
          <h2 className="text-2xl font-bold text-center">Pré-visualização: {titulo}</h2>
          
          <div className="p-6 border rounded-lg bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Col 1: Info da Via */}
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-xl font-bold text-primary">{dadosPrevia.viaName}</h3>
                <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                  <span>{dadosPrevia.totalTrechos} trecho(s)</span>
                  <span>Extensão: {dadosPrevia.extensaoKm.toFixed(2)} km</span>
                  <span>Nº de Estacas: {formatKmToStakes(dadosPrevia.extensaoKm)}</span>
                </div>
              </div>

              <div className="space-y-1 text-center">
              <span className="text-xs font-bold text-muted-foreground uppercase">Estações (n)</span>
              <p className="text-xl font-semibold text-foreground">
                {dadosPrevia.totalEstacoesConsideradas}
              </p>
           </div>
              
              {/* Col 2: Info de Patologias */}
              <div className="text-left md:text-right">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Total de Patologias (Fa)</span>
                  <p className="text-3xl font-bold">{dadosPrevia.totalPatologias}</p>
                </div>
              </div>
            </div>
            
            {/* IGG Total (Movido para cá) */}
            <div className="text-center mt-6 border-t pt-6">
              <h3 className="font-semibold mb-2">IGG DA VIA (Referência)</h3>
              <IggDisplay igg={dadosPrevia.iggTotal} />
            </div>
          </div>
          
          {/* --- 4. TABELAS (AGORA RENDERIZADAS) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  {dadosPrevia.tabelaPatologias.map((row, i) => (
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
                  {dadosPrevia.tabelaCalculo.map((row, i) => (
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
          {/* --- FIM DAS TABELAS --- */}
          
          <Button onClick={handleSalvar} disabled={isSaving} className="w-full" size="lg">
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            2. Salvar Relatório Definitivo
          </Button>
        </div>
      )}
    </div>
  );
}