'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Relatorio, User, Trecho, Via, StatusAprovacao, RelatorioTipo } from '@prisma/client';
// Importa a lista de relatórios da página de aprovações
import { RelatorioList } from '@/app/dashboard-engenheiro/aprovacoes/_components/relatorio-list';
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
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
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

interface RelatoriosClientPageProps {
  relatorios: RelatorioComDados[];
  fiscaisList: FiscalSimples[];
}

// Opções para os novos filtros
const statusOptions = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'PENDENTES', label: 'Pendentes & Corrigidos' },
  { value: StatusAprovacao.APROVADO, label: 'Aprovado' },
  { value: StatusAprovacao.REPROVADO, label: 'Reprovado' },
];

const tipoOptions = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: RelatorioTipo.RFT, label: 'RFT' },
  { value: RelatorioTipo.RDS, label: 'RDS' },
];

export function RelatoriosClientPage({
  relatorios,
  fiscaisList,
}: RelatoriosClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estados dos filtros
  const [fiscalId, setFiscalId] = useState(searchParams.get('fiscalId') || '');
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  );
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  );

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);

    // Função auxiliar para definir ou deletar parâmetros
    const setOrDelete = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };

    setOrDelete('fiscalId', fiscalId);
    setOrDelete('tipo', tipo);
    setOrDelete('status', status);
    setOrDelete('from', from ? format(from, 'yyyy-MM-dd') : '');
    setOrDelete('to', to ? format(to, 'yyyy-MM-dd') : '');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };
  
  // Lógica para o Select de Fiscal (para evitar o bug do value="")
  const handleFiscalChange = (value: string) => {
    setFiscalId(value === 'all' ? '' : value);
  };
  const fiscalSelectValue = fiscalId || 'all';
  
  // Nova lógica para o Select de Tipo
  const handleTipoChange = (value: string) => {
    setTipo(value === 'all' ? '' : value);
  };
  const tipoSelectValue = tipo || 'all';
  
  // Nova lógica para o Select de Status
  const handleStatusChange = (value: string) => {
    setStatus(value === 'all' ? '' : value);
  };
  const statusSelectValue = status || 'all';

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE FILTROS */}
      <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Filtro Fiscal */}
          <div>
            <label className="text-sm font-medium">Fiscal</label>
            <Select value={fiscalSelectValue} onValueChange={handleFiscalChange}>
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
          
          {/* Filtro Tipo */}
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select value={tipoSelectValue} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Tipos" />
              </SelectTrigger>
              <SelectContent>
                {tipoOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* --- 4. CORREÇÃO: Aplicar lógica ao Select de Status --- */}
          <div>
            <label className="text-sm font-medium">Status</label>
            <Select value={statusSelectValue} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Data Início */}
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

          {/* Filtro Data Fim */}
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
            Filtrar Relatórios
          </Button>
        </div>
      </div>

      {/* 2. SEÇÃO DA LISTA */}
      <div className="mt-6">
        <RelatorioList relatorios={relatorios} listType="all_search" />
      </div>
    </div>
  );
}