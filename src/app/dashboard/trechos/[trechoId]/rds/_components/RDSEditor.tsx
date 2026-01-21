'use client';

import { useState, useTransition } from 'react';
// CORREÇÃO: Importe os tipos completos
import type { Vistoria, Foto, Relatorio, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateRDS } from '@/actions/relatorios';
import { X } from 'lucide-react';
import { PhotoSelectorCard } from '@/app/dashboard/_components/PhotoSelectorCard';

// CORREÇÃO: Defina a tipagem completa que o PhotoSelectorCard espera
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface DadosRDS {
  clima?: string;
  horarioEntrada?: string;
  horarioSaida?: string;
  anotacoes?: string;
  ocorrencias?: string;
}

interface RDSEditorProps {
  relatorio: Relatorio & { vistoria: Vistoria, fotos: { foto: FotoComDados }[] }; // CORREÇÃO: Tipo aninhado
  fotosDaVistoria: FotoComDados[]; // CORREÇÃO: Use a tipagem completa
  trechoId: string;
}

export function RDSEditor({ relatorio, fotosDaVistoria, trechoId }: RDSEditorProps) {
  const router = useRouter();
  const initialFotoIds = relatorio.fotos.map(f => f.foto.id);
  const [selectedFotos, setSelectedFotos] = useState<string[]>(initialFotoIds);
  const [isPending, startTransition] = useTransition();
  const [fullscreenFoto, setFullscreenFoto] = useState<FotoComDados | null>(null);
  
  const dadosAtuais: DadosRDS = relatorio.dadosJson ? JSON.parse(relatorio.dadosJson) : {};

  const handleFotoClick = (fotoId: string) => {
    setSelectedFotos(prev => prev.includes(fotoId) ? prev.filter(id => id !== fotoId) : [...prev, fotoId]);
  };

  const handleSubmit = (formData: FormData) => {
    selectedFotos.forEach(fotoId => formData.append('fotoIds', fotoId));
    startTransition(async () => {
      const result = await updateRDS(formData);
      if (result.error) {
        alert(`Erro: ${result.error}`);
      } else {
        alert(result.success);
        router.push(`/dashboard/trechos/${trechoId}/rds`);
      }
    });
  };

  return (
    <>
      <form action={handleSubmit}>
        <input type="hidden" name="relatorioId" value={relatorio.id} />
        <input type="hidden" name="trechoId" value={trechoId} />

        <div className="mb-6 p-4 border rounded-md bg-gray-50">
          <h3 className="font-semibold text-gray-800">Vistoria de Referência</h3>
          <p className="text-sm text-gray-600">{new Date(relatorio.vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - {relatorio.vistoria.motivo}</p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label htmlFor="clima">Clima</label><select name="clima" id="clima" required defaultValue={dadosAtuais.clima || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"><option value="Ensolarado">Ensolarado</option><option value="Nublado">Nublado</option><option value="Chuvoso">Chuvoso</option><option value="Tempo instável">Tempo instável</option></select></div>
          <div><label htmlFor="horarioEntrada">Entrada</label><input type="time" name="horarioEntrada" id="horarioEntrada" required defaultValue={dadosAtuais.horarioEntrada} className="mt-1 block w-full rounded-md border-gray-300 p-2" /></div>
          <div><label htmlFor="horarioSaida">Saída</label><input type="time" name="horarioSaida" id="horarioSaida" required defaultValue={dadosAtuais.horarioSaida} className="mt-1 block w-full rounded-md border-gray-300 p-2" /></div>
          <div className="md:col-span-2 lg:col-span-3"><label htmlFor="anotacoes">Anotações</label><textarea name="anotacoes" id="anotacoes" rows={3} defaultValue={dadosAtuais.anotacoes} className="mt-1 block w-full rounded-md border-gray-300 p-2"></textarea></div>
          <div className="md:col-span-2 lg:col-span-3"><label htmlFor="ocorrencias">Ocorrências</label><textarea name="ocorrencias" id="ocorrencias" rows={3} defaultValue={dadosAtuais.ocorrencias} className="mt-1 block w-full rounded-md border-gray-300 p-2"></textarea></div>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-semibold text-gray-800 mb-2">Anexar Fotos (Opcional)</label>
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
          <button type="submit" disabled={isPending} className="rounded-lg bg-orange-600 px-6 py-3 text-white transition hover:bg-orange-700 disabled:bg-gray-400">
            {isPending ? 'Salvando...' : 'Salvar Alterações no RDS'}
          </button>
          <Link href={`/dashboard/trechos/${trechoId}/rds`} className="text-sm text-gray-600 hover:underline">Cancelar</Link>
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