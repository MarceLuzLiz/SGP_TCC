'use client';

import { useState, useTransition } from 'react';
import { StatusAprovacao } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { requestCancellation } from '@/actions/relatorios';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import React from 'react'; // Para tipos de evento

interface RequestCancellationButtonProps {
  relatorioId: string;
  status: StatusAprovacao;
}

export function RequestCancellationButton({
  relatorioId,
  status,
}: RequestCancellationButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  // 1. O componente só se renderiza se o status for APROVADO
  if (status !== StatusAprovacao.APROVADO) {
    return null;
  }

  // Abre o modal e impede a navegação do <Link> pai
  const openModal = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Fecha o modal e impede a navegação
  const closeModal = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setIsModalOpen(false);
    setMotivo(''); // Limpa o motivo
    setError('');  // Limpa o erro
  };

  // Envia a solicitação
  const handleSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Validação do formulário
    if (motivo.trim().length < 10) {
      setError('O motivo deve ter pelo menos 10 caracteres.');
      return;
    }
    setError('');

    startTransition(async () => {
      const formData = new FormData();
      formData.append('relatorioId', relatorioId);
      formData.append('motivoCancelamento', motivo);

      const result = await requestCancellation(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success);
        closeModal();
      }
    });
  };

 return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-yellow-600 border-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
        onClick={openModal} // Já para o evento
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        Solicitar Cancelamento
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent
          // --- A CORREÇÃO PRINCIPAL ESTÁ AQUI ---
          // Impede que cliques DENTRO do modal "vazem" para o <Link>
          onClick={(e) => e.stopPropagation()}
          
          // Impede que cliques FORA (no overlay) vazem
          onPointerDownOutside={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            closeModal();
          }}
        >
          <DialogHeader>
            <DialogTitle>Solicitar Cancelamento de Aprovação</DialogTitle>
            <DialogDescription>
              Descreva o motivo para solicitar o cancelamento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label htmlFor="motivoCancelamento">Motivo (obrigatório)</Label>
            <Textarea
              id="motivoCancelamento"
              placeholder="Ex: Aprovação indevida..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={isPending}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            {/* Os botões já param a propagação via 'closeModal' e 'handleSubmit' */}
            <Button variant="ghost" onClick={closeModal} disabled={isPending}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}