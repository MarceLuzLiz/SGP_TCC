'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2, FileText } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { getLogoUrl } from '@/lib/constants';
// Importa as Actions
import {
  getIndividualRelatorioPdfData,
  getConsolidadoViaPdfData,
  getGerencialViaPdfData,
} from '@/lib/actions/pdf-data';

// Importa os Componentes PDF
import { RelatorioPDF } from './RelatorioPDF';
import { RelatorioRDSPDF } from './RelatorioRDSPDF';
import { RelatorioConsolidadoRFTPDF } from './RelatorioConsolidadoRFTPDF';
import { RelatorioConsolidadoRDSPDF } from './RelatorioConsolidadoRDSPDF';
import { RelatorioGerencialPDF } from './RelatorioGerencialPDF';

// --- BOTÃO GENÉRICO DE DOWNLOAD ---
function BasePdfButton({ onClick, isLoading }: { onClick: () => void; isLoading: boolean }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.preventDefault(); // Impede navegação do Link pai
        e.stopPropagation();
        onClick();
      }}
      disabled={isLoading}
      title="Baixar PDF"
      className="text-muted-foreground hover:text-primary"
    >
      {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
    </Button>
  );
}

// Helper para disparar o download no browser
const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


// 1. BOTÃO PARA RELATÓRIO INDIVIDUAL (RFT/RDS)
export function DownloadIndividualButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const data = await getIndividualRelatorioPdfData(id);
      const logo = getLogoUrl();
      
      let doc;
      if (data.tipo === 'RFT') {
        doc = <RelatorioPDF {...data} logoUrl={logo} />;
      } else {
        doc = <RelatorioRDSPDF {...data} logoUrl={logo} />;
      }

      const blob = await pdf(doc).toBlob();
      triggerDownload(blob, `${data.tipo}_${data.trechoNome}.pdf`);
      toast.success('PDF baixado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setLoading(false);
    }
  };

  return <BasePdfButton onClick={handleClick} isLoading={loading} />;
}

// 2. BOTÃO PARA CONSOLIDADO (RFT/RDS VIA)
export function DownloadConsolidadoViaButton({ id, type }: { id: string; type: 'RFT_VIA' | 'RDS_VIA' }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const data = await getConsolidadoViaPdfData(id);
      const logo = getLogoUrl();
      
      let doc;
      if (type === 'RFT_VIA') {
        doc = <RelatorioConsolidadoRFTPDF {...data} logoUrl={logo} />;
      } else {
        doc = <RelatorioConsolidadoRDSPDF {...data} logoUrl={logo} />;
      }

      const blob = await pdf(doc).toBlob();
      triggerDownload(blob, `${data.titulo}.pdf`);
      toast.success('PDF consolidado baixado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF consolidado.');
    } finally {
      setLoading(false);
    }
  };

  return <BasePdfButton onClick={handleClick} isLoading={loading} />;
}

// 3. BOTÃO PARA GERENCIAL VIA
export function DownloadGerencialButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const data = await getGerencialViaPdfData(id);
      const logo = getLogoUrl();
      
      const doc = <RelatorioGerencialPDF dados={data} titulo={data.titulo} dataGeracao={new Date(data.dataGeracao)} criadoPor={data.criadoPor} logoUrl={logo} />;

      const blob = await pdf(doc).toBlob();
      triggerDownload(blob, `${data.titulo}.pdf`);
      toast.success('Relatório Gerencial baixado!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar PDF gerencial.');
    } finally {
      setLoading(false);
    }
  };

  return <BasePdfButton onClick={handleClick} isLoading={loading} />;
}