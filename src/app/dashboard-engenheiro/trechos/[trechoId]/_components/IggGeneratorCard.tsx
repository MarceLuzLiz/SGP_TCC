'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileBarChart, Loader2, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { getRelatorioIggTrechoPdfData } from '@/lib/actions/pdf-data';
import { RelatorioIggTrechoPDF } from '@/components/pdf/RelatorioIggTrechoPDF';
import { getLogoUrl } from '@/lib/constants';

interface VistoriaOption {
  id: string;
  data: Date;
}

interface IggGeneratorCardProps {
  trechoId: string;
  vistorias: VistoriaOption[]; // Passar apenas vistorias com RFT Aprovado
}

export function IggGeneratorCard({ trechoId, vistorias }: IggGeneratorCardProps) {
  const [selectedVistoria, setSelectedVistoria] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!selectedVistoria) return;
    setIsGenerating(true);

    try {
      const data = await getRelatorioIggTrechoPdfData(trechoId, selectedVistoria);
      const logo = getLogoUrl();

      const blob = await pdf(
        <RelatorioIggTrechoPDF {...data} logoUrl={logo} />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `IGG_Trecho_${new Date(data.dataVistoria).toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Relatório IGG gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar relatório.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <FileBarChart className="mr-2 h-5 w-5 text-primary" />
          Gerar Relatório de IGG
        </CardTitle>
        <CardDescription>
          Selecione uma vistoria aprovada para gerar o relatório IGG deste trecho.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <Select value={selectedVistoria} onValueChange={setSelectedVistoria}>
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Selecione a data da vistoria" />
          </SelectTrigger>
          <SelectContent>
            {vistorias.length === 0 ? (
               <SelectItem value="none" disabled>Nenhuma vistoria aprovada</SelectItem>
            ) : (
               vistorias.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {new Date(v.data).toLocaleDateString('pt-BR')}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        <Button 
          onClick={handleDownload} 
          disabled={!selectedVistoria || isGenerating || vistorias.length === 0}
        >
          {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Baixar Relatório
        </Button>
      </CardContent>
    </Card>
  );
}