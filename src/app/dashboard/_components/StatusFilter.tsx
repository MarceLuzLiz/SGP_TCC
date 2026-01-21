// src/app/dashboard/_components/StatusFilter.tsx
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

const statuses = [
  { value: 'PENDENTE', label: 'Pendente', color: 'yellow' },
  { value: 'CORRIGIDO', label: 'Corrigido', color: 'orange' },
  { value: 'APROVADO', label: 'Aprovado', color: 'green' },
  { value: 'REPROVADO', label: 'Reprovado', color: 'red' },
];

export function StatusFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  // Inicializa o estado com todos os status presentes na URL
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(
    searchParams.getAll('status')
  );

  const handleCheckboxChange = (statusValue: string) => {
    setSelectedStatuses(prev => 
      prev.includes(statusValue)
        ? prev.filter(s => s !== statusValue) // Desmarca
        : [...prev, statusValue] // Marca
    );
  };

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    // Remove todos os parâmetros 'status' antigos para reconstruir a lista
    params.delete('status');
    // Adiciona cada status selecionado como um novo parâmetro 'status'
    selectedStatuses.forEach(status => params.append('status', status));

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={`transition-opacity ${isPending ? 'opacity-50' : 'opacity-100'}`}>
    <div className="p-4 bg-gray-50 rounded-lg border mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Status</label>
      <div className="flex flex-wrap items-center gap-4">
        {statuses.map(status => (
          <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedStatuses.includes(status.value)}
              onChange={() => handleCheckboxChange(status.value)}
              className={`h-4 w-4 rounded border-gray-300 text-${status.color}-600 focus:ring-${status.color}-500`}
            />
            <span className="text-sm text-gray-600">{status.label}</span>
          </label>
        ))}
        <button onClick={handleFilter} disabled={isPending} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-75 disabled:cursor-wait">
              {isPending ? 'Filtrar' : 'Filtrar'}
            </button>
      </div>
    </div>
    </div>
  );
}