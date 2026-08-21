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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateVia } from '@/lib/actions/vias';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';

interface EditViaDialogProps {
  via: {
    id: string;
    name: string;
    bairro: string;
    municipio: string;
    estado: string;
  };
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  showIconOnly?: boolean;
}

export function EditViaDialog({
  via,
  triggerVariant = 'outline',
  triggerSize = 'sm',
  showIconOnly = false,
}: EditViaDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(via.name);
  const [bairro, setBairro] = useState(via.bairro);
  const [municipio, setMunicipio] = useState(via.municipio);
  const [estado, setEstado] = useState(via.estado);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!name.trim() || !bairro.trim() || !municipio.trim() || !estado.trim()) {
      toast.error('Todos os campos são obrigatórios.');
      return;
    }

    startTransition(async () => {
      const result = await updateVia(via.id, {
        name,
        bairro,
        municipio,
        estado,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={showIconOnly ? 'icon' : triggerSize}
          className={
            showIconOnly
              ? 'h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer'
              : 'gap-1.5 cursor-pointer text-sm font-medium'
          }
          title="Editar dados da via"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          {!showIconOnly && <span>Editar Via</span>}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[480px]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Identificação da Via
            </DialogTitle>
            <DialogDescription>
              Altere o nome e os dados de localização da via. O traçado e a quilometragem permanecem preservados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="via-name" className="text-sm font-semibold">
                Nome da Via / Rua <span className="text-destructive">*</span>
              </Label>
              <Input
                id="via-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Av. Marquês de Herval"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="via-bairro" className="text-sm font-semibold">
                  Bairro <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="via-bairro"
                  required
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Ex: Pedreira"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="via-municipio" className="text-sm font-semibold">
                  Município <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="via-municipio"
                  required
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  placeholder="Ex: Belém"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="via-estado" className="text-sm font-semibold">
                Estado (UF) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="via-estado"
                required
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                placeholder="Ex: PA"
              />
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
            <Button type="submit" disabled={isPending || !name.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditViaDialog;
