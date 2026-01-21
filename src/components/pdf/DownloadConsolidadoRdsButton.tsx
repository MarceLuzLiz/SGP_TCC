'use client';

import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RelatorioConsolidadoRDSPDF, TrechoRDSData } from './RelatorioConsolidadoRDSPDF';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';

interface DownloadConsolidadoRdsButtonProps {
  dados: {
    titulo: string;
    viaNome: string;
    dataGeracao: Date;
    // O nome de quem criou o relatório consolidado (geralmente o sistema ou o usuário logado)
    criadoPor?: string; 
    trechos: TrechoRDSData[];
  };
  fileName?: string;
}

export function DownloadConsolidadoRdsButton({ 
  dados, 
  fileName = 'relatorio_consolidado_rds.pdf' 
}: DownloadConsolidadoRdsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const logo = getLogoUrl();
      // 1. Gera o Blob do PDF
      const blob = await pdf(
        <RelatorioConsolidadoRDSPDF
          {...dados}
          // TODO: Substitua pela URL real da sua logo (pode ser importada localmente ou URL pública)
          logoUrl={logo} 
        />
      ).toBlob();

      // 2. Cria a URL e força o download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('PDF consolidado gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o arquivo PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload} 
      disabled={isGenerating} 
      variant="outline" 
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Baixar PDF Consolidado
        </>
      )}
    </Button>
  );
}