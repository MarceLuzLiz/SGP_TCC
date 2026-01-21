'use client';

import { useState, useTransition } from 'react';
// CORREÇÃO: Importe os tipos completos
import type { Vistoria, Foto, Relatorio, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateRFT } from '@/actions/relatorios';
import { X } from 'lucide-react';
import { PhotoSelectorCard } from '@/app/dashboard/_components/PhotoSelectorCard';

// CORREÇÃO: Defina a tipagem completa que o PhotoSelectorCard espera
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface RFTEditorProps {
  relatorio: Relatorio & { vistoria: Vistoria, fotos: { foto: FotoComDados }[] }; // CORREÇÃO: Tipo aninhado
  fotosDaVistoria: FotoComDados[]; // CORREÇÃO: Use a tipagem completa
  trechoId: string;
}

export function RFTEditor({ relatorio, fotosDaVistoria, trechoId }: RFTEditorProps) {
  const router = useRouter();
  const initialFotoIds = relatorio.fotos.map(f => f.foto.id);
  const [selectedFotos, setSelectedFotos] = useState<string[]>(initialFotoIds);
  const [isPending, startTransition] = useTransition();
  const [fullscreenFoto, setFullscreenFoto] = useState<FotoComDados | null>(null);

  const handleFotoClick = (fotoId: string) => {
    setSelectedFotos(prev => prev.includes(fotoId) ? prev.filter(id => id !== fotoId) : [...prev, fotoId]);
  };

  const handleSubmit = (formData: FormData) => {
    selectedFotos.forEach(fotoId => formData.append('fotoIds', fotoId));
    startTransition(async () => {
      const result = await updateRFT(formData);
      if (result.error) {
        alert(`Erro: ${result.error}`);
      } else {
        alert(result.success);
        router.push(`/dashboard/trechos/${trechoId}/rft`);
      }
    });
  };

  return (
    <>
      <form action={handleSubmit}>
        <input type="hidden" name="relatorioId" value={relatorio.id} />
        <input type="hidden" name="trechoId" value={trechoId} />

        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-gray-800">Vistoria de Referência (não pode ser alterada)</h3>
          <p className="text-sm text-gray-600">{new Date(relatorio.vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {relatorio.vistoria.motivo}</p>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-2">Selecione as Fotos para o Relatório</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotosDaVistoria.map(foto => (
              <PhotoSelectorCard
                key={foto.id}
                foto={foto}
                isSelected={selectedFotos.includes(foto.id)}
                onSelect={handleFotoClick}
                onViewFullscreen={setFullscreenFoto}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={selectedFotos.length === 0 || isPending} className="rounded-lg bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700 disabled:bg-gray-400">
            {isPending ? 'Salvando...' : `Salvar Alterações (${selectedFotos.length} fotos)`}
          </button>
          <Link href={`/dashboard/trechos/${trechoId}/rft`} className="text-sm text-gray-600 hover:underline">
            Cancelar
          </Link>
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