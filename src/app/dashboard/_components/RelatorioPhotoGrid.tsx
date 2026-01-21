'use client';

import { useState } from 'react';
import type { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import { Eye, Tag, Maximize, X } from 'lucide-react';

// A tipagem agora precisa incluir as relações completas
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface RelatorioPhotoGridProps {
  fotos: FotoComDados[];
}

export function RelatorioPhotoGrid({ fotos }: RelatorioPhotoGridProps) {
  const [fullscreenFoto, setFullscreenFoto] = useState<FotoComDados | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {fotos.map((foto) => (
          <div key={foto.id} className="rounded-lg overflow-hidden shadow-md bg-white">
            <div className="relative group">
              <Image 
                src={foto.imageUrl} 
                alt={foto.patologia?.classificacaoEspecifica || foto.rdsOcorrencia?.ocorrencia || 'Foto'} 
                width={600} 
                height={400} 
                className="w-full h-48 object-cover" 
              />
              <div 
                onClick={() => setFullscreenFoto(foto)}
                className="absolute inset-0 flex items-center justify-center bg-black/10 bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 cursor-pointer"
              >
                <Eye className="h-10 w-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            {/* --- MUDANÇA PRINCIPAL AQUI --- */}
            <div className="p-4 text-sm space-y-1">
              {foto.tipo === 'RFT' && foto.patologia ? (
                <>
                  <p className="font-bold text-gray-800 truncate" title={foto.patologia.classificacaoEspecifica}>
                    {foto.patologia.classificacaoEspecifica}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {foto.descricao || 'Sem descrição'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 pt-2 mt-2 border-t">
                    <span className="mr-auto">Dim: {foto.extensaoM || '...'}m x {foto.larguraM || '...'}m</span>
                    <span className="font-semibold">({foto.patologia.codigoDnit}) Estaca: {foto.estaca}</span>
                  </div>
                </>
              ) : foto.tipo === 'RDS' && foto.rdsOcorrencia ? (
                <>
                  <p className="font-bold text-gray-800 truncate" title={foto.rdsOcorrencia.ocorrencia}>
                    {foto.rdsOcorrencia.ocorrencia}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {foto.descricao || 'Sem descrição'}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 pt-2 mt-2 border-t">
                    <span>{new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Tela Cheia */}
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