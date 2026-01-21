'use client';

import type { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import { CheckCircle, Eye, Tag, Maximize } from 'lucide-react';

// A tipagem agora precisa incluir as relações completas
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface PhotoSelectorCardProps {
  foto: FotoComDados;
  isSelected: boolean;
  onSelect: (fotoId: string) => void;
  onViewFullscreen: (foto: FotoComDados) => void;
}

export function PhotoSelectorCard({ foto, isSelected, onSelect, onViewFullscreen }: PhotoSelectorCardProps) {
  return (
    <div className={`rounded-lg overflow-hidden border-2 transition ${isSelected ? 'border-blue-500' : 'border-transparent'} bg-white shadow-md`}>
      <div className="relative">
        <Image
          src={foto.imageUrl}
          alt={foto.patologia?.classificacaoEspecifica || foto.rdsOcorrencia?.ocorrencia || 'Foto'}
          width={400}
          height={300}
          className="h-48 w-full object-cover"
        />
        {/* Ícone de Seleção */}
        <div 
          onClick={() => onSelect(foto.id)}
          className={`absolute top-2 left-2 z-20 h-6 w-6 rounded-full border-2 border-white bg-black bg-opacity-30 cursor-pointer flex items-center justify-center transition hover:scale-110 ${isSelected ? 'bg-blue-600 border-blue-400' : ''}`}
          title="Selecionar foto"
        >
          {isSelected && <CheckCircle size={16} className="text-white" />}
        </div>
        {/* Ícone de Tela Cheia */}
        <div 
            onClick={() => onViewFullscreen(foto)}
            className="absolute bottom-2 right-2 z-10 rounded-full bg-black bg-opacity-50 p-2 text-white cursor-pointer hover:bg-opacity-75 transition"
            title="Visualizar em tela cheia"
        >
            <Eye size={20} />
        </div>
      </div>
      
      {/* --- MUDANÇA PRINCIPAL AQUI --- */}
      <div className="p-3 text-sm space-y-1">
        {foto.tipo === 'RFT' && foto.patologia ? (
          <>
            <p className="font-bold text-gray-800 truncate" title={foto.patologia.classificacaoEspecifica}>
              {foto.patologia.classificacaoEspecifica}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {foto.descricao || 'Sem descrição'}
            </p>
            <div className="flex items-center text-xs text-gray-500 pt-1">
              <span className="mr-auto">Dim: {foto.extensaoM || '...'}m x {foto.larguraM || '...'}m</span>
              <span className="font-semibold">{foto.patologia.codigoDnit}</span>
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
            <div className="flex items-center text-xs text-gray-500 pt-1">
              <span>{new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}</span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}