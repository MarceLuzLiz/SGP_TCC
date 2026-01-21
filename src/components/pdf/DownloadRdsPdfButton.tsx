'use client';

import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RelatorioRDSPDF } from './RelatorioRDSPDF'; // Importa o layout novo
import { Foto, Patologia, RdsOcorrencia } from '@prisma/client';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';

type FotoCompleta = Foto & {
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

interface DownloadRdsPdfButtonProps {
  dados: {
    titulo: string;
    tipo: string;
    trechoNome: string;
    viaNome: string;
    dataVistoria: Date;
    criadoPor: string;
    aprovadoPor: string | null;
    fotos: FotoCompleta[];
    dadosRDS: DadosRDS;
  };
  fileName?: string;
}

export function DownloadRdsPdfButton({ dados, fileName = 'relatorio_rds.pdf' }: DownloadRdsPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const logo = getLogoUrl();
      const blob = await pdf(
        <RelatorioRDSPDF
          {...dados}
          logoUrl={logo} // TODO: Sua logo aqui
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

      toast.success('PDF do RDS gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={handleDownload} disabled={isGenerating} variant="outline" size="sm">
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
        </>
      ) : (
        <>
          <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
        </>
      )}
    </Button>
  );
}