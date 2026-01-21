'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  assignFiscalToVia,
  removeFiscalFromVia,
} from '@/actions/equipe';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

// Tipos de dados vindos do Servidor
type FiscalSimples = { id: string; name: string; email: string };
type ViaSimples = { id: string; name: string; estacas: string | null };
type FiscalDetalhado = {
  id: string;
  name: string;
  email: string;
  assignedVias: {
    via: ViaSimples;
  }[];
} | null;

interface EquipeClientPageProps {
  fiscaisList: FiscalSimples[];
  viasList: ViaSimples[];
  fiscalDetails: FiscalDetalhado;
}

export function EquipeClientPage({
  fiscaisList,
  viasList,
  fiscalDetails,
}: EquipeClientPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // O ID do fiscal selecionado atualmente (vindo da URL)
  const selectedUserId = searchParams.get('userId');

  // Ação: Quando o usuário seleciona um fiscal no dropdown
  const handleFiscalSelect = (userId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('userId', userId);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Ação: Adicionar uma via ao fiscal selecionado
  const handleAssignSubmit = (formData: FormData) => {
    if (!selectedUserId) return;
    formData.append('userId', selectedUserId);

    startTransition(async () => {
      const result = await assignFiscalToVia(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  // Ação: Remover uma via do fiscal selecionado
  const handleRemoveClick = (viaId: string) => {
    if (!selectedUserId) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', selectedUserId);
      formData.append('viaId', viaId);
      const result = await removeFiscalFromVia(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
      }
    });
  };

  // Filtra a lista de vias para mostrar apenas as que *ainda não*
  // foram atribuídas a este fiscal, para o dropdown de "adicionar"
  const viasDisponiveis = viasList.filter(
    (via) =>
      !fiscalDetails?.assignedVias.some(
        (assigned) => assigned.via.id === via.id,
      ),
  );

  return (
    <div className="space-y-6">
      {/* 1. SELETOR DE FISCAL */}
      <div className="max-w-md">
        <label className="text-sm font-medium">Selecione um Fiscal</label>
        <Select onValueChange={handleFiscalSelect} value={selectedUserId || ''}>
          <SelectTrigger>
            <SelectValue placeholder="Buscar fiscal por nome ou email..." />
          </SelectTrigger>
          <SelectContent>
            {fiscaisList.map((fiscal) => (
              <SelectItem key={fiscal.id} value={fiscal.id}>
                {fiscal.name} ({fiscal.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. GERENCIADOR (só aparece se um fiscal for selecionado) */}
      {fiscalDetails && (
        <div className="mt-6 space-y-6">
          <Separator />
          <h3 className="text-lg font-semibold">
            Gerenciar Vias de: {fiscalDetails.name}
          </h3>

          {/* 2a. Formulário para Adicionar Vias */}
          <form action={handleAssignSubmit} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Adicionar Via</label>
              <Select name="viaId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma via para adicionar..." />
                </SelectTrigger>
                <SelectContent>
                  {viasDisponiveis.length > 0 ? (
                    viasDisponiveis.map((via) => (
                      <SelectItem key={via.id} value={via.id}>
                        {via.name}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      Este fiscal já tem acesso a todas as vias.
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isPending || viasDisponiveis.length === 0}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar
            </Button>
          </form>

          {/* 2b. Lista de Vias Atribuídas */}
          <div className="space-y-2">
            <h4 className="font-medium">Vias Atribuídas</h4>
            {fiscalDetails.assignedVias.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este fiscal ainda não tem acesso a nenhuma via.
              </p>
            ) : (
              <ul className="space-y-2">
                {fiscalDetails.assignedVias.map(({ via }) => (
                  <li
                    key={via.id}
                    className="flex justify-between items-center rounded-md border p-3"
                  >
                    <div>
                      <span className="font-medium">{via.name}</span>
                      <p className="text-xs text-muted-foreground">
                        Estacas: {via.estacas || 'N/D'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleRemoveClick(via.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}