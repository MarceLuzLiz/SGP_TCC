'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function FiltroGerencial() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState<Date | undefined>(
    searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
  );
  const [to, setTo] = useState<Date | undefined>(
    searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
  );

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);

    if (from) params.set('from', format(from, 'yyyy-MM-dd'));
    else params.delete('from');
    
    if (to) params.set('to', format(to, 'yyyy-MM-dd'));
    else params.delete('to');

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50 mb-6 flex items-end gap-4">
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
      <Button onClick={handleFilter} disabled={isPending}>
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Filtrar
      </Button>
    </div>
  );
}