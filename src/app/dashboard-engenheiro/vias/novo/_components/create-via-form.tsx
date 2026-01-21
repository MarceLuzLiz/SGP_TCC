'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createVia } from '@/lib/actions/vias'; // Verifique o caminho
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateViaMap } from './create-via-map'; // O mapa que criaremos a seguir

// Tipo para as coordenadas que o mapa nos devolverá
export type Coordenada = {
  lat: number;
  lng: number;
};

export function CreateViaForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estado para os dados do mapa
  const [trajeto, setTrajeto] = useState<Coordenada[]>([]);
  const [extensaoKm, setExtensaoKm] = useState(0);

  // Callback para o componente do mapa atualizar o estado do formulário
  const handleMapChange = (path: Coordenada[], lengthInKm: number) => {
    setTrajeto(path);
    setExtensaoKm(lengthInKm);
  };

  // Ação de submit do formulário
  const handleSubmit = (formData: FormData) => {
    // 1. Validar dados do formulário
    const name = formData.get('name') as string;
    if (!name) {
      toast.error('O campo "Nome da Via" é obrigatório.');
      return;
    }
    
    // 2. Validar dados do mapa
    if (trajeto.length < 2) {
      toast.error('O traçado da via precisa ter pelo menos 2 pontos.');
      return;
    }

    // 3. Adicionar dados do mapa ao FormData
    formData.append('extensaoKm', extensaoKm.toString());
    formData.append('trajetoJson', JSON.stringify(trajeto));

    // 4. Executar a Server Action
    startTransition(async () => {
      const result = await createVia(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        // Redireciona para a página de detalhes da nova via
        router.push(`/dashboard-engenheiro/vias/${result.newViaId}`);
      }
    });
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna 1: Formulário */}
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Via</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" name="bairro" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="municipio">Município</Label>
            <Input id="municipio" name="municipio" required defaultValue="Belém" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Input id="estado" name="estado" required defaultValue="PA" />
          </div>
          <div className="space-y-2">
            <Label>Extensão Calculada</Label>
            <Input
              value={`${extensaoKm.toFixed(3)} km`}
              disabled
              className="font-mono"
            />
          </div>
        </div>

        {/* Coluna 2: Mapa */}
        <div className="md:col-span-2 min-h-[500px]">
          <p className="text-sm font-medium mb-2">
            Clique no mapa para desenhar o ponto inicial e final. Arraste a linha para ajustar ao traçado.
          </p>
          <CreateViaMap onMapChange={handleMapChange} />
        </div>
      </div>

      <div className="flex justify-end border-t pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Via e Definir Trechos
        </Button>
      </div>
    </form>
  );
}