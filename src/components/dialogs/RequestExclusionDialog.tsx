'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { requestSuspendTrecho, requestSuspendVia } from '@/lib/actions/vias';
import { toast } from 'sonner';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

interface RequestExclusionDialogProps {
  type: 'trecho' | 'via';
  id: string;
  name: string;
  buttonVariant?: 'destructive' | 'outline' | 'ghost' | 'secondary';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  triggerLabel?: string;
  showIconOnly?: boolean;
}

export function RequestExclusionDialog({
  type,
  id,
  name,
  buttonVariant = 'outline',
  buttonSize = 'sm',
  triggerLabel,
  showIconOnly = false,
}: RequestExclusionDialogProps) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!motivo || motivo.trim().length < 5) {
      toast.error('Por favor, informe uma justificativa com pelo menos 5 caracteres.');
      return;
    }

    startTransition(async () => {
      const result =
        type === 'trecho'
          ? await requestSuspendTrecho(id, motivo)
          : await requestSuspendVia(id, motivo);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setOpen(false);
        setMotivo('');
      }
    });
  };

  const isTrecho = type === 'trecho';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={buttonVariant}
          size={buttonSize}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5 cursor-pointer"
          title={`Solicitar exclusão de ${isTrecho ? 'trecho' : 'via'}`}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
          {!showIconOnly && (triggerLabel || `Excluir ${isTrecho ? 'Trecho' : 'Via'}`)}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Solicitar Exclusão de {isTrecho ? 'Trecho' : 'Via'}
            </DialogTitle>
            <DialogDescription>
              O item <strong>"{name}"</strong> entrará em estado <strong>Suspenso</strong> para revisão e aprovação final do <strong>Administrador</strong>. Nenhum dado histórico será apagado imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo" className="text-sm font-semibold">
                Justificativa / Motivo da Exclusão <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="motivo"
                required
                rows={4}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Trecho cadastrado com quilometragem incorreta ou duplicada..."
                className="w-full rounded-md border border-input bg-background p-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Esta justificativa será analisada pelo Administrador para aprovar a exclusão permanente ou restaurar o item.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || motivo.trim().length < 5}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar para Suspensão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default RequestExclusionDialog;
