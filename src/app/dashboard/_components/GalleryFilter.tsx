'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Patologia, RdsOcorrencia } from '@prisma/client';

interface GalleryFilterProps {
  activeTab: 'RFT' | 'RDS';
  allPatologias: Patologia[];
  allRdsOcorrencias: RdsOcorrencia[];
}

export function GalleryFilter({ activeTab, allPatologias, allRdsOcorrencias }: GalleryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [startDate, setStartDate] = useState(searchParams.get('from') || '');
  const [endDate, setEndDate] = useState(searchParams.get('to') || '');
  const [codigo, setCodigo] = useState(searchParams.get('codigo') || '');
  const [ocorrencia, setOcorrencia] = useState(searchParams.get('ocorrencia') || '');

  // EFEITO PARA LIMPAR OS FILTROS AO TROCAR DE ABA
  // Este é o núcleo da correção do bug de "vazamento" de filtros.
  useEffect(() => {
    // Quando a aba ativa (que vem como prop) muda, resetamos os estados dos filtros
    setCodigo('');
    setOcorrencia('');
  }, [activeTab]);

  const handleFilter = () => {
    const params = new URLSearchParams(); // Começa com parâmetros limpos
    
    // Adiciona apenas os parâmetros que têm valor
    const setIfValue = (key: string, value: string) => {
      if (value) params.set(key, value);
    };

    setIfValue('from', startDate);
    setIfValue('to', endDate);

    // Adiciona apenas o filtro relevante para a aba ativa
    if (activeTab === 'RFT') {
      setIfValue('codigo', codigo);
    } else {
      setIfValue('ocorrencia', ocorrencia);
    }

    // Mantém o parâmetro da aba na URL
    params.set('tab', activeTab);
    
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Filtros de Data */}
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md" />
        </div>

        {/* FILTRO DE CÓDIGO (AGORA É UM SELECT) */}
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">Código (DNIT)</label>
          <select 
            id="codigo" 
            value={codigo} 
            onChange={e => setCodigo(e.target.value)} 
            className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200" 
            disabled={activeTab === 'RDS'}
          >
            <option value="">Todos</option>
            {allPatologias.map(p => <option key={p.id} value={p.codigoDnit}>{p.codigoDnit} - {p.classificacaoEspecifica}</option>)}
          </select>
        </div>
        
        {/* FILTRO DE OCORRÊNCIA */}
        <div>
          <label htmlFor="ocorrencia" className="block text-sm font-medium text-gray-700 mb-1">Ocorrência (RDS)</label>
          <select 
            id="ocorrencia" 
            value={ocorrencia} 
            onChange={e => setOcorrencia(e.target.value)} 
            className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200" 
            disabled={activeTab === 'RFT'}
          >
            <option value="">Todas</option>
            {allRdsOcorrencias.map(occ => <option key={occ.id} value={occ.id}>{occ.ocorrencia}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={handleFilter} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Filtrar</button>
      </div>
    </div>
  );
}