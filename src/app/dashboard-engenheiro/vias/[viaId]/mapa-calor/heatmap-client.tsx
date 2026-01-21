'use client';

import { useState, useRef } from 'react';
import { ViaHeatmap } from '@/components/maps/ViaHeatmap';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { pdf } from '@react-pdf/renderer';
import { HeatmapPDF } from '@/components/pdf/HeatmapPDF';
import { toast } from 'sonner';
import { HeatmapPoint } from '@/lib/actions/heatmap-data';

interface Coordenada {
  lat: number;
  lng: number;
}

interface ViaData {
  name: string;
  trajetoJson: Coordenada[] | string | null; 
}

interface HeatmapClientProps {
    via: ViaData; 
    heatmapData: HeatmapPoint[];
}

export default function HeatmapClient({ via, heatmapData }: HeatmapClientProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const mapDivRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!mapDivRef.current) return;
    setIsGeneratingPdf(true);
    toast.info("Gerando imagem do mapa, aguarde...");

    try {
      // Pequeno delay para garantir que o mapa esteja "quieto" antes do print
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(mapDivRef.current, { 
        useCORS: true, 
        scale: 2,
        backgroundColor: '#ffffff',
        // CORREÇÃO CRÍTICA: onclone
        // Modificamos a cópia do documento que o html2canvas usa, sem afetar a tela do usuário.
        onclone: (clonedDoc) => {
          // 1. Removemos todos os <link> de CSS (geralmente o Tailwind/Next.js está aqui)
          // O Google Maps não precisa deles para renderizar a imagem do mapa.
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(link => link.remove());

          // 2. Removemos estilos globais que possam conter oklch nas tags <style>
          // Nota: O Google Maps injeta seus próprios estilos em <style>. 
          // Se removermos TUDO, o mapa pode quebrar. Vamos tentar remover apenas os links primeiro.
          // Se ainda der erro, descomente a linha abaixo para remover styles também (exceto os do Google)
          // const styles = clonedDoc.querySelectorAll('style');
          // styles.forEach(s => { if(!s.innerHTML.includes('.gm-')) s.remove(); });

          // 3. Forçamos um estilo inline básico no body do clone para garantir reset
          clonedDoc.body.style.backgroundColor = '#ffffff';
          clonedDoc.body.style.color = '#000000';
        },
        ignoreElements: (element) => {
           const className = typeof element.className === 'string' ? element.className : '';
           return className.includes('gmnoprint') || className.includes('gm-style-cc');
        }
      });
      
      const imgData = canvas.toDataURL('image/png');

      const blob = await pdf(
        <HeatmapPDF 
            viaNome={via.name} 
            mapImageBase64={imgData} 
            dataGeracao={new Date()} 
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mapa_Calor_${via.name.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("PDF gerado com sucesso!");

    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro técnico ao gerar imagem do mapa. Tente usar outro navegador se persistir.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  let trajetoFormatado: Coordenada[] | null = null;
  if (Array.isArray(via.trajetoJson)) {
    trajetoFormatado = via.trajetoJson as Coordenada[];
  } else if (typeof via.trajetoJson === 'string') {
    try {
      trajetoFormatado = JSON.parse(via.trajetoJson) as Coordenada[];
    } catch {
      trajetoFormatado = [];
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mapa de Calor: {via.name}</h1>
        <Button onClick={handleDownloadPDF} disabled={isGeneratingPdf}>
          {isGeneratingPdf ? <Loader2 className="mr-2 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Baixar PDF
        </Button>
      </div>

      {/* Mantemos os estilos inline de segurança */}
      <div 
        ref={mapDivRef} 
        className="rounded-lg overflow-hidden"
        style={{ 
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          color: '#000000',
        }}
      >
        <ViaHeatmap 
            trajeto={trajetoFormatado} 
            heatmapData={heatmapData}
        />
      </div>
    </div>
  );
}