'use client';

import { useState } from 'react';
import type { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { X, CheckCircle, Download, Eye, Tag, Info, MapPin, Calendar, SquareDashed, CameraOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Tipagem completa que recebemos da página
type FotoComDados = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface GaleriaFotosTabProps {
  initialFotos: FotoComDados[];
  trechoId: string;
  allPatologias: Patologia[];
  allRdsOcorrencias: RdsOcorrencia[];
}

// O componente de filtro (baseado no seu GalleryFilter.tsx)
function GalleryFilter({ activeTab, allPatologias, allRdsOcorrencias }: {
  activeTab: 'RFT' | 'RDS';
  allPatologias: Patologia[];
  allRdsOcorrencias: RdsOcorrencia[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados dos filtros, inicializados pela URL
  const [startDate, setStartDate] = useState(searchParams.get('from') || '');
  const [endDate, setEndDate] = useState(searchParams.get('to') || '');
  const [codigo, setCodigo] = useState(searchParams.get('codigo') || '');
  const [ocorrencia, setOcorrencia] = useState(searchParams.get('ocorrencia') || '');

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams);
    
    // Seta ou deleta os parâmetros
    const setOrDelete = (key: string, value: string) => {
      if (value) params.set(key, value);
      else params.delete(key);
    };

    setOrDelete('from', startDate);
    setOrDelete('to', endDate);

    // Limpa os filtros da outra aba ao aplicar
    if (activeTab === 'RFT') {
      setOrDelete('codigo', codigo);
      params.delete('ocorrencia');
    } else {
      setOrDelete('ocorrencia', ocorrencia);
      params.delete('codigo');
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Filtros de Data */}
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
          <input type="date" id="start-date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
          <input type="date" id="end-date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 border rounded-md text-sm" />
        </div>

        {/* Filtro de Patologia */}
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">Código (DNIT)</label>
          <select 
            id="codigo" value={codigo} onChange={e => setCodigo(e.target.value)} 
            className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200 text-sm" 
            disabled={activeTab === 'RDS'}
          >
            <option value="">Todos</option>
            {allPatologias.map(p => <option key={p.id} value={p.codigoDnit}>{p.codigoDnit} - {p.classificacaoEspecifica}</option>)}
          </select>
        </div>
        
        {/* Filtro de Ocorrência */}
        <div>
          <label htmlFor="ocorrencia" className="block text-sm font-medium text-gray-700 mb-1">Ocorrência (RDS)</label>
          <select 
            id="ocorrencia" value={ocorrencia} onChange={e => setOcorrencia(e.target.value)} 
            className="w-full p-2 border rounded-md bg-white disabled:bg-gray-200 text-sm" 
            disabled={activeTab === 'RFT'}
          >
            <option value="">Todas</option>
            {allRdsOcorrencias.map(occ => <option key={occ.id} value={occ.id}>{occ.ocorrencia}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleFilter}>Filtrar</Button>
      </div>
    </div>
  );
}


// O componente principal da galeria
export function GaleriaFotosTab({ initialFotos, allPatologias, allRdsOcorrencias }: GaleriaFotosTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // A fonte da verdade para a aba é a URL
  const activeTab = searchParams.get('tab') === 'RDS' ? 'RDS' : 'RFT';

  const [downloadSelection, setDownloadSelection] = useState<string[]>([]);
  const [isZipping, setIsZipping] = useState(false);
  const [selectedFoto, setSelectedFoto] = useState<FotoComDados | null>(null);

  const handleTabChange = (tab: 'RFT' | 'RDS') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    // Limpa filtros da outra aba ao trocar
    if (tab === 'RFT') params.delete('ocorrencia');
    if (tab === 'RDS') params.delete('codigo');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
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
    const photosToDownload = initialFotos.filter(f => downloadSelection.includes(f.id));

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
      toast.error("Ocorreu um erro ao preparar as fotos para download.");
    } finally {
      setIsZipping(false);
      setDownloadSelection([]);
    }
  };

  return (
    <>
      {/* Barra de Download */}
      {downloadSelection.length > 0 && (
        <div className="sticky top-16 z-40 mb-6 flex items-center justify-between gap-4 rounded-lg bg-blue-600 p-3 text-white shadow-lg">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700" onClick={() => setDownloadSelection([])}><X size={20} /></Button>
            <span className="font-semibold">{downloadSelection.length} foto(s) selecionada(s)</span>
          </div>
          <Button
            onClick={handleDownload}
            disabled={isZipping}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-100"
          >
            {isZipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download size={18} className="mr-2" />}
            {isZipping ? 'Compactando...' : 'Baixar'}
          </Button>
        </div>
      )}

      {/* Seleção de Abas (RFT/RDS) */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-4">
          <Button variant={activeTab === 'RFT' ? 'default' : 'ghost'} onClick={() => handleTabChange('RFT')}>Fotos RFT</Button>
          <Button variant={activeTab === 'RDS' ? 'default' : 'ghost'} onClick={() => handleTabChange('RDS')}>Fotos RDS</Button>
        </div>
      </div>
      
      {/* Filtros */}
      <GalleryFilter 
        activeTab={activeTab} 
        allPatologias={allPatologias}
        allRdsOcorrencias={allRdsOcorrencias}
      />
      
      {/* Grid de Fotos */}
      {initialFotos.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {initialFotos.map((foto) => {
            const isSelected = downloadSelection.includes(foto.id);
            const title = foto.tipo === 'RFT' ? foto.patologia?.classificacaoEspecifica : foto.rdsOcorrencia?.ocorrencia;
            const subtitle = foto.tipo === 'RFT' 
              ? `${foto.patologia?.codigoDnit} (${foto.patologia?.mapeamentoIgg})`
              : foto.rdsOcorrencia?.categoria;

            return (
              <div key={foto.id} className="group relative rounded-lg shadow-md overflow-hidden bg-white">
                {/* Overlay para ver detalhes */}
                <div onClick={() => setSelectedFoto(foto)} className="absolute inset-0 z-10 cursor-pointer" title="Ver detalhes" />
                {/* Botão de Seleção */}
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
                    <span>{new Date(foto.dataCaptura).toLocaleDateString('pt-BR')}</span>
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
          <p className="mt-1 text-sm text-gray-500">Tente ajustar os filtros ou não há fotos do tipo {activeTab} para este trecho.</p>
        </div>
      )}

      {/* Modal de Visualização (SOMENTE LEITURA) */}
      {selectedFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setSelectedFoto(null)}>
          <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="absolute -top-4 -right-4 z-10 rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-200" onClick={() => setSelectedFoto(null)}><X size={24} /></Button>
            
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3"><Image src={selectedFoto.imageUrl} alt={selectedFoto.patologia?.classificacaoEspecifica || selectedFoto.rdsOcorrencia?.ocorrencia || 'Foto'} width={800} height={800} className="h-auto w-full rounded-l-lg object-contain bg-gray-100"/></div>
              <div className="md:w-1/3 p-6">
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
                    <p className="flex items-center"><SquareDashed className="mr-2 h-4 w-4 text-gray-400" />{selectedFoto.extensaoM}(m) x {selectedFoto.larguraM}(m)</p>
                    {/* Exibe a Estaca que adicionamos ao schema */}
                    <p className="flex items-center"><Eye className="mr-2 h-4 w-4 text-gray-400" />Estaca: {selectedFoto.estaca || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}