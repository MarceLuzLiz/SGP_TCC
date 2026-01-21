'use client';

import { useState, useTransition, useMemo } from 'react';
// CORREÇÃO: Importe os tipos completos
import type { Vistoria, Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import { createRFT } from '@/actions/relatorios';
import { Info, X } from 'lucide-react';
import { PhotoSelectorCard } from '@/app/dashboard/_components/PhotoSelectorCard';

// CORREÇÃO: Defina a tipagem completa que o PhotoSelectorCard espera
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface RFTCreatorProps {
  vistorias: Vistoria[];
  fotos: FotoComDados[]; // CORREÇÃO: Use a tipagem completa
  trechoId: string;
}

export function RFTCreator({ vistorias, fotos, trechoId }: RFTCreatorProps) {
  const [selectedVistoria, setSelectedVistoria] = useState<string>('');
  const [selectedFotos, setSelectedFotos] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [fullscreenFoto, setFullscreenFoto] = useState<FotoComDados | null>(null);

  const filteredPhotos = useMemo(() => {
    if (!selectedVistoria) return [];
    return fotos.filter((foto) => foto.vistoriaId === selectedVistoria && foto.tipo === 'RFT');
  }, [selectedVistoria, fotos]);

  const handleFotoClick = (fotoId: string) => {
    setSelectedFotos((prev) => prev.includes(fotoId) ? prev.filter((id) => id !== fotoId) : [...prev, fotoId]);
  };
  
  const handleVistoriaChange = (vistoriaId: string) => {
    setSelectedVistoria(vistoriaId);
    setSelectedFotos([]);
  };

  const handleSubmit = (formData: FormData) => {
    selectedFotos.forEach((fotoId) => formData.append('fotoIds', fotoId));
    startTransition(async () => {
      const result = await createRFT(formData);
      if (result.error) { alert(`Erro: ${result.error}`); } 
      else {
        alert(result.success);
        setSelectedVistoria('');
        setSelectedFotos([]);
      }
    });
  };

  return (
    <>
      <form action={handleSubmit}>
        <input type="hidden" name="trechoId" value={trechoId} />

        <div className="mb-6">
          <label htmlFor="vistoriaId" className="block text-lg font-semibold text-gray-800 mb-2">
            Passo 1: Selecione a Vistoria de Referência
          </label>
          <select
            id="vistoriaId"
            name="vistoriaId"
            value={selectedVistoria}
            onChange={(e) => handleVistoriaChange(e.target.value)}
            required
            className="w-full max-w-md rounded-md border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="" disabled>Selecione uma data/motivo...</option>
            {vistorias.map((vistoria) => (
              <option key={vistoria.id} value={vistoria.id}>
                {new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {vistoria.motivo}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-2">Passo 2: Selecione as Fotos (RFT)</label>
          {!selectedVistoria ? (
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center"><Info className="mr-2 h-5 w-5" />Selecione uma vistoria para ver as fotos.</div>
          ) : filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((foto) => (
                <PhotoSelectorCard
                  key={foto.id}
                  foto={foto}
                  isSelected={selectedFotos.includes(foto.id)}
                  onSelect={handleFotoClick}
                  onViewFullscreen={setFullscreenFoto}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma foto do tipo RFT encontrada para esta vistoria.</p>
          )}
        </div>
        
        <div>
          <h3 className="block text-lg font-semibold text-gray-800 mb-2">Passo 3: Gerar Relatório</h3>
          <button type="submit" disabled={!selectedVistoria || selectedFotos.length === 0 || isPending} className="rounded-lg bg-teal-600 px-6 py-3 text-white transition hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
            {isPending ? 'Salvando...' : `Criar RFT com ${selectedFotos.length} fotos`}
          </button>
        </div>
      </form>

      {fullscreenFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80" onClick={() => setFullscreenFoto(null)}>
          <div className="relative w-full h-full max-w-5xl max-h-screen-lg p-4">
            <button onClick={() => setFullscreenFoto(null)} className="absolute top-4 right-4 z-10 rounded-full bg-white p-2 text-gray-800"><X size={24} /></button>
            <Image src={fullscreenFoto.imageUrl} alt={fullscreenFoto.patologia?.classificacaoEspecifica || fullscreenFoto.rdsOcorrencia?.ocorrencia || 'Foto'} layout="fill" objectFit="contain" />
          </div>
        </div>
      )}
    </>
  );
}