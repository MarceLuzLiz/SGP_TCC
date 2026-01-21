'use client';

import { useState, useTransition } from 'react';
import { createRelatorioConsolidado } from '@/lib/actions/relatorios-via';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Tipos de dados
type RelatorioSimples = {
  id: string;
  vistoria: { dataVistoria: Date };
};
type TrechoComRelatorios = {
  id: string;
  nome: string;
  relatorios: RelatorioSimples[];
};

interface CreateConsolidadoFormProps {
  viaId: string;
  trechos: TrechoComRelatorios[];
  tipoConsolidado: 'RFT_VIA' | 'RDS_VIA';
}

export function CreateConsolidadoForm({
  viaId,
  trechos,
  tipoConsolidado,
}: CreateConsolidadoFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  // Estado para guardar o ID do relatório selecionado para CADA trecho
  // Ex: { trechoId1: relatorioId4, trechoId2: relatorioId7 }
  const [selecao, setSelecao] = useState<Record<string, string>>({});

  const handleSelectChange = (trechoId: string, relatorioId: string) => {
    setSelecao((prev) => ({
      ...prev,
      [trechoId]: relatorioId,
    }));
  };

  const handleSubmit = (formData: FormData) => {
    const relatoriosSelecionados = Object.values(selecao).filter(Boolean); // Pega só os IDs

    if (relatoriosSelecionados.length === 0) {
      toast.error('Selecione ao menos um relatório.');
      return;
    }

    formData.append('viaId', viaId);
    formData.append('tipo', tipoConsolidado);
    formData.append('relatoriosSelecionados', relatoriosSelecionados.join(','));

    startTransition(async () => {
      const result = await createRelatorioConsolidado(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        router.push(`/dashboard-engenheiro/vias/${viaId}`);
      }
    });
  };

  const tipoLabel = tipoConsolidado === 'RFT_VIA' ? 'RFT' : 'RDS';

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título do Relatório</Label>
        <Input
          name="titulo"
          id="titulo"
          placeholder={`Ex: ${tipoLabel} Consolidado - Nov/2025`}
          required
        />
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Selecionar Relatórios ({tipoLabel}) Aprovados</h3>
        {trechos.map((trecho) => (
          <div key={trecho.id} className="grid grid-cols-3 gap-4 items-center">
            <Label className="col-span-1">{trecho.nome}</Label>
            <div className="col-span-2">
              <Select
                onValueChange={(value) => handleSelectChange(trecho.id, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecionar ${tipoLabel} do trecho...`} />
                </SelectTrigger>
                <SelectContent>
                  {trecho.relatorios.length > 0 ? (
                    trecho.relatorios.map((rel) => (
                      <SelectItem key={rel.id} value={rel.id}>
                        Vistoria de:{' '}
                        {new Date(
                          rel.vistoria.dataVistoria,
                        ).toLocaleDateString('pt-BR')}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-xs text-muted-foreground">
                      Nenhum {tipoLabel} aprovado disponível.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar Relatório Consolidado
      </Button>
    </form>
  );
}