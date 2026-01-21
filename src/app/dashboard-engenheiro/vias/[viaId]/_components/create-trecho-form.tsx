'use client';

import { useTransition } from 'react';
import { createTrecho } from '@/lib/actions/vias'; // Verifique o caminho
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTrechoFormProps {
  viaId: string;
  viaExtensaoKm: number;
}

export function CreateTrechoForm({
  viaId,
  viaExtensaoKm,
}: CreateTrechoFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    // Adiciona o viaId ao formData
    formData.append('viaId', viaId);

    // Validação simples no frontend
    const kmInicial = parseFloat(formData.get('kmInicial') as string);
    const kmFinal = parseFloat(formData.get('kmFinal') as string);

    if (kmFinal <= kmInicial) {
      toast.error('O Km Final deve ser maior que o Km Inicial.');
      return;
    }
    if (kmFinal > viaExtensaoKm) {
      toast.warning(
        `O Km Final (${kmFinal}) excede a extensão total da via (${viaExtensaoKm} km).`,
      );
    }

    startTransition(async () => {
      const result = await createTrecho(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        // Limpa o formulário (se o form for um <form> nativo,
        // o Next.js revalidará a página e o form não precisará ser limpo,
        // mas se for controlado pelo React, você precisará limpar o estado)
      }
    });
  };

  return (
    // Usamos a 'action' do formulário para chamar a Server Action
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Trecho</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: Trecho 1 - Início"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="kmInicial">Km Inicial</Label>
          <Input
            id="kmInicial"
            name="kmInicial"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kmFinal">Km Final</Label>
          <Input
            id="kmFinal"
            name="kmFinal"
            type="number"
            step="0.01"
            placeholder={viaExtensaoKm.toFixed(2)}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Adicionar Trecho
      </Button>
    </form>
  );
}