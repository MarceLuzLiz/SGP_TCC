'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import React from 'react'; // <-- 1. Importar React

interface ReproveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (motivo: string) => void;
  isPending: boolean;
}

export function ReproveModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: ReproveModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  // 2. Atualizar o handleSubmit para aceitar o evento de clique
  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault(); // Para o <Link> de navegar
    e.stopPropagation(); // Para o evento de "borbulhar"

    if (motivo.trim().length < 5) {
      setError('O motivo deve ter pelo menos 5 caracteres.');
      return;
    }
    setError('');
    onSubmit(motivo); // Chama a função original
  };

  // 3. Criar um handleCancel para parar o evento
  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose(); // Chama a função original
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        // --- ADICIONE ESTA LINHA ---
        onClick={(e) => e.stopPropagation()}
        
        // E estas para cliques externos (overlay)
        onPointerDownOutside={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      >
        <DialogHeader>
          <DialogTitle>Reprovar Relatório</DialogTitle>
          <DialogDescription>
            Por favor, descreva o motivo da reprovação. O fiscal verá esta
            mensagem.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Textarea
            placeholder="Ex: Faltam fotos da patologia X, favor corrigir..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            disabled={isPending}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          {/* 4. Usar os novos handlers */}
          <Button variant="ghost" onClick={handleCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reprovação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}