'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Relatorio, User, Trecho, Via } from '@prisma/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RelatorioList } from './relatorio-list'; // Criaremos a seguir
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { AlertTriangle, Calendar as CalendarIcon, CheckCircle, Clock, FileEdit, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos de dados vindos do Servidor
type FiscalSimples = { id: string; name: string; email: string };
type RelatorioComDados = Relatorio & {
  user: Pick<User, 'name'>;
  trecho: Pick<Trecho, 'id' | 'nome'> & {
    via: Pick<Via, 'name'>;
  };
};

interface ApprovalClientPageProps {
  pendentes: RelatorioComDados[];
  corrigidos: RelatorioComDados[];
  cancelamentoPendente: RelatorioComDados[];
  aprovados: RelatorioComDados[];
  reprovados: RelatorioComDados[];
  fiscaisList: FiscalSimples[];
}

export function ApprovalClientPage({
  pendentes,
  corrigidos,
  cancelamentoPendente,
  aprovados,
  reprovados,
  fiscaisList,
}: ApprovalClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estados dos filtros, inicializados pela URL
  const [fiscalId, setFiscalId] = useState(searchParams.get('fiscalId') || '');
  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  );
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  );

  const activeTab = searchParams.get('tab') || 'pendentes';

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);

    // Define ou remove os parâmetros
    if (fiscalId) params.set('fiscalId', fiscalId);
    else params.delete('fiscalId');
    
    if (from) params.set('from', format(from, 'yyyy-MM-dd'));
    else params.delete('from');
    
    if (to) params.set('to', format(to, 'yyyy-MM-dd'));
    else params.delete('to');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleTabChange = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFiscalChange = (value: string) => {
    setFiscalId(value === 'all' ? '' : value);
  };

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE FILTROS */}
      <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Filtrar por Fiscal</label>
            <Select value={fiscalId || 'all'} onValueChange={handleFiscalChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os fiscais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os fiscais</SelectItem>
                {fiscaisList.map((fiscal) => (
                  <SelectItem key={fiscal.id} value={fiscal.id}>
                    {fiscal.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Data Início</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {from ? format(from, 'PPP', { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={from} onSelect={setFrom} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium">Data Fim</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {to ? format(to, 'PPP', { locale: ptBR }) : <span>Selecione</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={to} onSelect={setTo} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleFilter} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar Filtros
          </Button>
        </div>
      </div>

      {/* 2. SEÇÃO DAS ABAS */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
          <TabsTrigger value="pendentes" className="gap-2">
            <Clock className="h-4 w-4" />
            Pendentes <span className="ml-1 text-xs bg-primary/10 px-1.5 rounded-full">{pendentes.length}</span>
          </TabsTrigger>
          
          <TabsTrigger value="corrigidos" className="gap-2">
            <FileEdit className="h-4 w-4" />
            Corrigidos <span className="ml-1 text-xs bg-primary/10 px-1.5 rounded-full">{corrigidos.length}</span>
          </TabsTrigger>
          
          <TabsTrigger value="cancelamento" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Em Canc. <span className="ml-1 text-xs bg-primary/10 px-1.5 rounded-full">{cancelamentoPendente.length}</span>
          </TabsTrigger>

          <TabsTrigger value="aprovados" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Aprovados <span className="ml-1 text-xs bg-primary/10 px-1.5 rounded-full">{aprovados.length}</span>
          </TabsTrigger>
          
          <TabsTrigger value="reprovados" className="gap-2">
            <XCircle className="h-4 w-4" />
            Reprovados <span className="ml-1 text-xs bg-primary/10 px-1.5 rounded-full">{reprovados.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* CONTEÚDO DAS ABAS */}
        
        <TabsContent value="pendentes" className="mt-4">
          {/* Pendentes usam a lista com ações de Aprovar/Reprovar */}
          <RelatorioList relatorios={pendentes} listType="pendentes" />
        </TabsContent>

        <TabsContent value="corrigidos" className="mt-4">
          {/* Corrigidos TAMBÉM usam as ações de Aprovar/Reprovar */}
          <RelatorioList relatorios={corrigidos} listType="pendentes" />
        </TabsContent>

        <TabsContent value="cancelamento" className="mt-4">
          {/* Em Cancelamento mostra apenas status (Engenheiro não age aqui, é o Admin) */}
          <RelatorioList relatorios={cancelamentoPendente} listType="all_search" />
        </TabsContent>

        <TabsContent value="aprovados" className="mt-4">
          {/* Aprovados mostram o botão de 'Solicitar Cancelamento' */}
          <RelatorioList relatorios={aprovados} listType="aprovados" />
        </TabsContent>

        <TabsContent value="reprovados" className="mt-4">
          {/* Reprovados apenas visualizam */}
          <RelatorioList relatorios={reprovados} listType="reprovados" />
        </TabsContent>
      </Tabs>
    </div>
  );
}