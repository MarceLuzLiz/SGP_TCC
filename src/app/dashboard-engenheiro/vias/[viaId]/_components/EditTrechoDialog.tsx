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
import { updateTrecho } from '@/lib/actions/vias';
import { toast } from 'sonner';
import { Loader2, Pencil } from 'lucide-react';

interface EditTrechoDialogProps {
  trecho: {
    id: string;
    nome: string;
    cor: string;
    kmInicial: number;
    kmFinal: number;
  };
  triggerVariant?: 'outline' | 'ghost' | 'secondary';
  showIconOnly?: boolean;
}

const COLOR_PRESETS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Âmbar
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#ef4444', // Vermelho
  '#64748b', // Cinza
];

export function EditTrechoDialog({
  trecho,
  triggerVariant = 'ghost',
  showIconOnly = true,
}: EditTrechoDialogProps) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(trecho.nome);
  const [cor, setCor] = useState(trecho.cor || '#3b82f6');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!nome.trim()) {
      toast.error('O nome do trecho não pode ficar vazio.');
      return;
    }

    startTransition(async () => {
      const result = await updateTrecho(trecho.id, {
        nome,
        cor,
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
          size={showIconOnly ? 'icon' : 'sm'}
          className={
            showIconOnly
              ? 'h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer'
              : 'gap-1.5 cursor-pointer text-sm font-medium'
          }
          title="Editar nome e cor do trecho"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Pencil className="h-4 w-4" />
          {!showIconOnly && <span>Editar Trecho</span>}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="sm:max-w-[450px]"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Trecho
            </DialogTitle>
            <DialogDescription>
              Altere a identificação nominal e a cor cartográfica do trecho (Km {trecho.kmInicial.toFixed(2)} ao Km {trecho.kmFinal.toFixed(2)}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trecho-nome" className="text-sm font-semibold">
                Nome / Identificação do Trecho <span className="text-destructive">*</span>
              </Label>
              <Input
                id="trecho-nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Trecho 01 - Km 00 ao Km 02"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Cor no Mapa</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={cor}
                  onChange={(e) => setCor(e.target.value)}
                  className="h-9 w-12 rounded cursor-pointer border p-0.5"
                  title="Seletor de cor livre"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCor(preset)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                        cor.toLowerCase() === preset.toLowerCase()
                          ? 'border-foreground scale-110 shadow-sm'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: preset }}
                      title={`Selecionar ${preset}`}
                    />
                  ))}
                </div>
              </div>
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
            <Button type="submit" disabled={isPending || !nome.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditTrechoDialog;
