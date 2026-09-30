'use client';

import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { RelatorioGerencialPDF, DadosGerenciaisPDF } from './RelatorioGerencialPDF';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';

interface DownloadGerencialPdfButtonProps {
  dados: DadosGerenciaisPDF;
  titulo: string;
  dataGeracao: Date;
  criadoPor: string;
  fileName?: string;
}

export function DownloadGerencialPdfButton({ 
  dados, 
  titulo, 
  dataGeracao, 
  criadoPor,
  fileName = 'relatorio_gerencial.pdf' 
}: DownloadGerencialPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // 1. Gera o Blob do PDF usando o componente de layout
      const logo = getLogoUrl();

      const blob = await pdf(
        <RelatorioGerencialPDF
          dados={dados}
          titulo={titulo}
          dataGeracao={dataGeracao}
          criadoPor={criadoPor}
          // TODO: Substitua pela URL real da sua logo (pode ser importada localmente ou URL pública)
          logoUrl={logo} 
        />
      ).toBlob();

      // 2. Cria a URL e força o download no navegador
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório Gerencial gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o arquivo PDF. Verifique o console.');
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
          Baixar Relatório Gerencial
        </>
      )}
    </Button>
  );
}