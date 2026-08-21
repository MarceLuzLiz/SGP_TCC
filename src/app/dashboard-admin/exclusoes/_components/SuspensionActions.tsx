'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  restoreTrecho,
  restoreVia,
  permanentDeleteTrecho,
  permanentDeleteVia,
} from '@/lib/actions/admin';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Trash2 } from 'lucide-react';

interface SuspensionActionsProps {
  type: 'via' | 'trecho';
  id: string;
  name: string;
}

export function SuspensionActions({ type, id, name }: SuspensionActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleRestore = () => {
    if (window.confirm(`Deseja RESTAURAR ${type === 'via' ? 'a via' : 'o trecho'} "${name}"? O item voltará ao status ativo normal.`)) {
      startTransition(async () => {
        const result =
          type === 'via' ? await restoreVia(id) : await restoreTrecho(id);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    }
  };

  const handlePermanentDelete = () => {
    const confirmation = window.prompt(
      `ATENÇÃO: Esta ação é IRREVERSÍVEL!\nTodos os dados, fotos, vistorias e relatórios associados a este item serão apagados permanentemente do banco de dados.\n\nPara confirmar, digite exatamente "EXCLUIR":`
    );

    if (confirmation === 'EXCLUIR') {
      startTransition(async () => {
        const result =
          type === 'via'
            ? await permanentDeleteVia(id)
            : await permanentDeleteTrecho(id);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    } else if (confirmation !== null) {
      toast.info('Exclusão cancelada (palavra de confirmação incorreta).');
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={handleRestore}
        disabled={isPending}
        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 gap-1"
        title="Reativar item e retornar ao status normal"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Restaurar
      </Button>

      <Button
        variant="destructive"
        size="sm"
        onClick={handlePermanentDelete}
        disabled={isPending}
        className="gap-1"
        title="Excluir permanentemente do banco de dados"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Excluir Definitivo
      </Button>
    </div>
  );
}
