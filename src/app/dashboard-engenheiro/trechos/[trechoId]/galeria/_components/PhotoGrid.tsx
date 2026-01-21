'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { GalleryFilter } from './GalleryFilter'; // <-- CORREÇÃO: Importação local
import {
  X,
  CheckCircle,
  Download,
  Trash2,
  FilePenLine,
  Tag,
  Info,
  MapPin,
  Calendar,
  SquareDashed,
  CameraOff,
  FlagTriangleRight
} from 'lucide-react';
import { deleteFoto, updateFotoDetails } from '@/actions/fotos'; // Assumindo que seu @/actions/fotos está correto

// (O resto do seu arquivo 'PhotoGrid.tsx' que você forneceu)
// ... (cole todo o conteúdo do seu PhotoGrid.tsx aqui) ...

// Tipagem completa para garantir que os objetos de relação estão presentes
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

// A interface agora recebe os dados iniciais e as listas de base
interface PhotoGridProps {
  initialFotos: FotoComDados[];
  trechoId: string;
  allPatologias: Patologia[];
  allRdsOcorrencias: RdsOcorrencia[];
}

export function PhotoGrid({ initialFotos, trechoId, allPatologias, allRdsOcorrencias }: PhotoGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // A FONTE DA VERDADE para a aba ativa é a URL.
  const activeTab = searchParams.get('tab') === 'RDS' ? 'RDS' : 'RFT';

  const [fotos, setFotos] = useState(initialFotos);
  const [downloadSelection, setDownloadSelection] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedFoto, setSelectedFoto] = useState<FotoComDados | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPatologiaId, setSelectedPatologiaId] = useState('');
  const [selectedRdsOcorrenciaId, setSelectedRdsOcorrenciaId] = useState('');

  // Sincroniza as fotos quando a prop inicial muda (após um filtro)
  useEffect(() => {
    setFotos(initialFotos);
  }, [initialFotos]);

  // Sincroniza o estado dos dropdowns quando uma foto é selecionada para edição
  useEffect(() => {
    if (selectedFoto && isEditing) {
      setSelectedPatologiaId(selectedFoto.patologiaId || '');
      setSelectedRdsOcorrenciaId(selectedFoto.rdsOcorrenciaId || '');
    }
  }, [selectedFoto, isEditing]);

  const filteredPhotos = useMemo(() => {
    return fotos.filter((foto) => foto.tipo === activeTab);
  }, [activeTab, fotos]);

  const handleTabChange = (tab: 'RFT' | 'RDS') => {
    router.push(`${pathname}?tab=${tab}`);
  };

  const handleSelectionChange = (fotoId: string) => {
    setDownloadSelection(prev =>
      prev.includes(fotoId)
        ? prev.filter(id => id !== fotoId)
        : [...prev, fotoId]
    );
  };

  const handleDownload = async () => {
    if (downloadSelection.length === 0) return;
    setIsZipping(true);

    const zip = new JSZip();
    const photosToDownload = fotos.filter(f => downloadSelection.includes(f.id));

    try {
      const imagePromises = photosToDownload.map(async (foto) => {
        const response = await fetch(foto.imageUrl);
        if (!response.ok) throw new Error(`Falha ao buscar a imagem: ${foto.imageUrl}`);
        const blob = await response.blob();
        const title = foto.tipo === 'RFT' ? foto.patologia?.classificacaoEspecifica : foto.rdsOcorrencia?.ocorrencia;
        const filename = `${new Date(foto.dataCaptura).toISOString().split('T')[0]}_${title?.replace(/ /g, '_') || 'foto'}.jpg`;
        zip.file(filename, blob);
      });

      await Promise.all(imagePromises);
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `SGP_Fotos_${new Date().toISOString().split('T')[0]}.zip`);

    } catch (error) {
      console.error("Erro ao criar o arquivo zip:", error);
      alert("Ocorreu um erro ao preparar as fotos para download.");
    } finally {
      setIsZipping(false);
      setDownloadSelection([]);
    }
  };

  const handleDelete = async (fotoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) {
      const result = await deleteFoto(fotoId, trechoId);
      if (result.error) {
        alert(`Erro: ${result.error}`);
      } else {
        alert(result.success);
        closeModal();
      }
    }
  };

  const handleUpdateAction = async (formData: FormData) => {
    const result = await updateFotoDetails(formData);
    if (result.error) {
      alert(`Erro: ${result.error}`);
    } else {
      alert(result.success);
      if (result.updatedFoto) {
        setSelectedFoto(result.updatedFoto);
      }
      setIsEditing(false);
    }
  };

  const closeModal = () => {
    setSelectedFoto(null);
    setIsEditing(false);
  };

  return (
    <>
      {downloadSelection.length > 0 && (
        <div className="sticky top-20 z-40 mb-6 flex items-center justify-between gap-4 rounded-lg bg-blue-600 p-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <button onClick={() => setDownloadSelection([])} className="p-2 hover:bg-blue-700 rounded-full"><X size={20} /></button>
            <span className="font-semibold">{downloadSelection.length} foto(s) selecionada(s)</span>
          </div>
          <button
            onClick={handleDownload}
            disabled={isZipping}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-blue-600 font-bold transition hover:bg-blue-100 disabled:opacity-50 disabled:cursor-wait"
          >
            {isZipping ? 'Compactando...' : <><Download size={18} /> Baixar</>}
          </button>
        </div>
      )}

      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <button onClick={() => handleTabChange('RFT')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'RFT' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Fotos RFT</button>
          <button onClick={() => handleTabChange('RDS')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'RDS' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>Fotos RDS</button>
        </div>
      </div>
      
      <GalleryFilter 
        activeTab={activeTab} 
        allPatologias={allPatologias}
        allRdsOcorrencias={allRdsOcorrencias}
      />
      
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((foto) => {
            const isSelected = downloadSelection.includes(foto.id);
            const title = foto.tipo === 'RFT' ? foto.patologia?.classificacaoEspecifica : foto.rdsOcorrencia?.ocorrencia;
            const subtitle = foto.tipo === 'RFT' 
              ? `(${foto.patologia?.codigoDnit}) Estaca: ${foto.estaca}`
              : foto.rdsOcorrencia?.categoria;

            return (
              <div key={foto.id} className="group relative rounded-lg shadow-md overflow-hidden bg-white">
                <div onClick={() => setSelectedFoto(foto)} className="absolute inset-0 z-10 cursor-pointer" title="Ver detalhes" />
                <div onClick={() => handleSelectionChange(foto.id)} className={`absolute top-2 left-2 z-20 h-6 w-6 rounded-full border-2 border-white bg-black bg-opacity-30 cursor-pointer flex items-center justify-center transition hover:scale-110 ${isSelected ? 'bg-blue-600 border-blue-400' : ''}`} title="Selecionar para download">
                  {isSelected && <CheckCircle size={16} className="text-white" />}
                </div>

                <Image
                  src={foto.imageUrl}
                  alt={title || 'Foto'}
                  width={400} height={300}
                  className="h-48 w-full object-cover"
                />

                <div className="p-3">
                  <h3 className="font-bold text-gray-800 text-sm truncate" title={title || ''}>{title || 'Sem Título'}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <div className="flex items-baseline">
                      <span>{new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}</span>
                      {foto.tipo === 'RFT' && (foto.extensaoM || foto.larguraM) && (
                        <span className="ml-2 text-gray-400">({foto.extensaoM || '...'}m x {foto.larguraM || '...'}m)</span>
                      )}
                    </div>
                    <span className="font-semibold text-gray-700 shrink-0">{subtitle}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 py-12 text-center">
          <CameraOff className="h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nenhuma foto encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">Não há fotos do tipo {activeTab} para este trecho.</p>
        </div>
      )}

      {selectedFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={closeModal}>
          <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className="absolute -top-4 -right-4 z-10 rounded-full bg-white p-2 text-gray-700 shadow-lg hover:bg-gray-200"><X size={24} /></button>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3"><Image src={selectedFoto.imageUrl} alt={selectedFoto.patologia?.classificacaoEspecifica || selectedFoto.rdsOcorrencia?.ocorrencia || 'Foto'} width={800} height={800} className="h-auto w-full rounded-l-lg object-contain bg-gray-100"/></div>
              <div className="md:w-1/3 p-6">
                {isEditing ? (
                  <form action={handleUpdateAction} className="space-y-4">
                    <input type="hidden" name="fotoId" value={selectedFoto.id} />
                    <input type="hidden" name="trechoId" value={trechoId} />
                    <input type="hidden" name="tipo" value={selectedFoto.tipo} />
                    <h2 className="text-xl font-bold text-gray-800">Editar Detalhes</h2>
                    
                    {selectedFoto.tipo === 'RFT' ? (
                      <div>
                        <label htmlFor="patologiaId" className="block text-sm font-medium text-gray-700">Código (DNIT)</label>
                        <select 
                          name="patologiaId" 
                          id="patologiaId" 
                          value={selectedPatologiaId} 
                          onChange={(e) => setSelectedPatologiaId(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                          {allPatologias.map(p => <option key={p.id} value={p.id}>{p.codigoDnit}</option>)}
                        </select>
                        <p className="mt-1 text-xs text-gray-500 bg-gray-100 p-2 rounded">
                          {allPatologias.find(p => p.id === selectedPatologiaId)?.classificacaoEspecifica}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="rdsOcorrenciaId" className="block text-sm font-medium text-gray-700">Ocorrência</label>
                        <select 
                          name="rdsOcorrenciaId" 
                          id="rdsOcorrenciaId" 
                          value={selectedRdsOcorrenciaId} 
                          onChange={(e) => setSelectedRdsOcorrenciaId(e.target.value)} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                        >
                          {allRdsOcorrencias.map(occ => <option key={occ.id} value={occ.id}>{occ.ocorrencia}</option>)}
                        </select>
                      </div>
                    )}

                    <div><label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label><textarea name="descricao" id="descricao" rows={3} defaultValue={selectedFoto.descricao || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"></textarea></div>
                    
                    {selectedFoto.tipo === 'RFT' && (
                      <div className="flex gap-4">
                        <div><label htmlFor="extensaoM" className="block text-sm font-medium text-gray-700">Extensão (m)</label><input type="number" step="0.01" name="extensaoM" id="extensaoM" defaultValue={selectedFoto.extensaoM || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" /></div>
                        <div><label htmlFor="larguraM" className="block text-sm font-medium text-gray-700">Largura (m)</label><input type="number" step="0.01" name="larguraM" id="larguraM" defaultValue={selectedFoto.larguraM || ''} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2" /></div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                       <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300">Cancelar</button>
                       <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700">Salvar</button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedFoto.tipo === 'RFT' ? selectedFoto.patologia?.classificacaoEspecifica : selectedFoto.rdsOcorrencia?.ocorrencia}
                    </h2>
                    <div className="text-sm text-gray-600 space-y-3">
                      <p className="flex items-center"><Tag className="mr-2 h-4 w-4 text-gray-400" />
                        {selectedFoto.tipo === 'RFT' 
                          ? `${selectedFoto.patologia?.codigoDnit} (${selectedFoto.patologia?.mapeamentoIgg})`
                          : `Categoria: ${selectedFoto.rdsOcorrencia?.categoria}`
                        }
                      </p>
                      <p className="flex items-start"><Info className="mr-2 h-4 w-4 shrink-0 text-gray-400 mt-1" />{selectedFoto.descricao || 'Nenhuma descrição.'}</p>
                      <p className="flex items-center"><Calendar className="mr-2 h-4 w-4 text-gray-400" />{new Date(selectedFoto.dataCaptura).toLocaleString('pt-BR')}</p>
                      <p className="flex items-center"><MapPin className="mr-2 h-4 w-4 text-gray-400" />{selectedFoto.latitude}, {selectedFoto.longitude}</p>
                      <p className="flex items-center"><FlagTriangleRight className="mr-2 h-4 w-4 text-gray-400" />Estaca: {selectedFoto.estaca}</p>
                      <p className="flex items-center"><SquareDashed className="mr-2 h-4 w-4 text-gray-400" />{selectedFoto.extensaoM}(m) x {selectedFoto.larguraM}(m)</p>
                      
                    </div>
                    <div className="pt-4 border-t flex gap-2">
                       <button onClick={() => setIsEditing(true)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-white transition hover:bg-yellow-600">
                         <FilePenLine size={18} /> Editar
                       </button>
                       <button onClick={() => selectedFoto && handleDelete(selectedFoto.id)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700">
                         <Trash2 size={18} /> Excluir
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}