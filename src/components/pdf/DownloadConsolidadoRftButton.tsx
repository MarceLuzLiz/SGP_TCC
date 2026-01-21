'use client';

import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RelatorioConsolidadoRFTPDF, TrechoRFTData } from './RelatorioConsolidadoRFTPDF';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';

interface Props {
  dados: {
    titulo: string;
    viaNome: string;
    dataGeracao: Date;
    criadoPor: string;
    trechos: TrechoRFTData[];
  };
  fileName: string;
}

export function DownloadConsolidadoRftButton({ dados, fileName }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {

      const logo = getLogoUrl();
      const blob = await pdf(
        <RelatorioConsolidadoRFTPDF
          {...dados}
          logoUrl={logo} // TODO: Logo
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('PDF gerado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant="outline">
      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
      Baixar PDF Consolidado
    </Button>
  );
}