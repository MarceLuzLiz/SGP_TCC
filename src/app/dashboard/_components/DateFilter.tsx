'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

export function DateFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();
  
  const [startDate, setStartDate] = useState(searchParams.get('from') || '');
  const [endDate, setEndDate] = useState(searchParams.get('to') || '');

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (startDate) {
      params.set('from', startDate);
    } else {
      params.delete('from');
    }
    if (endDate) {
      params.set('to', endDate);
    } else {
      params.delete('to');
    }
    
    // CORREÇÃO: Envolve a navegação dentro de startTransition
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    // A classe condicional agora funcionará, pois `isPending` será atualizado
    <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border mb-6">
        <div className="flex-1">
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div className="flex-1">
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div className="self-end">
          <button onClick={handleFilter} disabled={isPending} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75 disabled:cursor-wait">
              {isPending ? 'Filtrar' : 'Filtrar'}
            </button>
        </div>
      </div>
    </div>
  );
}