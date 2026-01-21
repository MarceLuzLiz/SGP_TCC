'use client';

import { useTransition } from 'react';
import { deleteRelatorioVia } from '@/lib/actions/relatorios-via';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteButtonProps {
  relatorioViaId: string;
  viaId: string;
}

export function DeleteRelatorioViaButton({
  relatorioViaId,
  viaId,
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleClick = (e: React.MouseEvent) => {
    // Impede que o clique acione o <Link> pai
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.')) {
      startTransition(async () => {
        const result = await deleteRelatorioVia(relatorioViaId, viaId);
        if (result.success) {
          toast.success(result.success);
        } else {
          toast.error(result.error);
        }
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
      title="Excluir Relatório"
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Trash2 size={16} />
      )}
    </Button>
  );
}