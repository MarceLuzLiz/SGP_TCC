'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  approveCancellation,
  rejectCancellation,
} from '@/actions/relatorios';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CancellationActions({ relatorioId }: { relatorioId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    if (window.confirm('Tem certeza que deseja APROVAR este cancelamento? O relatório voltará para "Reprovado".')) {
      startTransition(async () => {
        const result = await approveCancellation(relatorioId);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    }
  };

  const handleReject = () => {
    if (window.confirm('Tem certeza que deseja REJEITAR este cancelamento? O relatório voltará para "Aprovado".')) {
      startTransition(async () => {
        const result = await rejectCancellation(relatorioId);
        if (result.error) toast.error(result.error);
        else toast.success(result.success);
      });
    }
  };

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? <Loader2 className="animate-spin" /> : 'Rejeitar'}
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={handleApprove}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white"
      >
        {isPending ? <Loader2 className="animate-spin" /> : 'Aprovar'}
      </Button>
    </div>
  );
}