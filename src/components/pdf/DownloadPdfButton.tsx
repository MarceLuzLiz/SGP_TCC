'use client';

import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RelatorioPDF } from './RelatorioPDF';
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';

// Tipos iguais ao do componente PDF
type FotoCompleta = Foto & {
  patologia: Patologia | null;
  rdsOcorrencia: RdsOcorrencia | null;
};

interface DownloadPdfButtonProps {
  dados: {
    titulo: string;
    tipo: string;
    trechoNome: string;
    viaNome: string;
    dataVistoria: Date;
    criadoPor: string;
    aprovadoPor: string | null;
    fotos: FotoCompleta[];
  };
  fileName?: string;
}

export function DownloadPdfButton({ dados, fileName = 'relatorio.pdf' }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const logo = getLogoUrl();
      // 1. Gera o documento
      const blob = await pdf(
        <RelatorioPDF
          {...dados}
          logoUrl={logo} // TODO: Troque pela URL da sua logo (public folder ou url externa)
        />
      ).toBlob();

      // 2. Cria link e clica programaticamente
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); // Limpa memória

      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant="outline">
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
        </>
      )}
    </Button>
  );
}