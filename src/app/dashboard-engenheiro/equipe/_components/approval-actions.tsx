'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  approveRelatorio,
  reproveRelatorio,
} from '@/actions/relatorios'; // Verifique o caminho
import { Loader2 } from 'lucide-react';
import { ReproveModal } from './reprove-modal';
import React from 'react'; // Importar React

interface ApprovalActionsProps {
  relatorio: { id: string; trechoId: string };
}

export function ApprovalActions({ relatorio }: ApprovalActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showReproveModal, setShowReproveModal] = useState(false);

  // Lógica original de aprovação
  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveRelatorio(relatorio.id, relatorio.trechoId);
      if (result.error) {
        alert(result.error); // TODO: Usar toast
      }
      // A revalidação da action atualizará a UI
    });
  };

  // Lógica original de reprovação
  const handleReprove = (motivo: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('relatorioId', relatorio.id);
      formData.append('trechoId', relatorio.trechoId);
      formData.append('motivoReprovacao', motivo);
      
      const result = await reproveRelatorio(formData);
      if (result.error) {
        alert(result.error); // TODO: Usar toast
      }
      setShowReproveModal(false);
    });
  };

  // --- NOVA LÓGICA DE CLIQUE ---
  // Este handler envolve a lógica de aprovação E para o evento
  const onApproveClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Para o <Link> de navegar
    e.stopPropagation(); // Para o evento de "borbulhar"
    handleApprove(); // Executa a ação
  };

  // Este handler envolve a lógica de reprovação E para o evento
  const onReproveClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Para o <Link> de navegar
    e.stopPropagation(); // Para o evento de "borbulhar"
    setShowReproveModal(true); // Abre o modal
  };
  // --- FIM DA NOVA LÓGICA ---

  return (
    <>
      {/* O div wrapper não é estritamente necessário, mas não faz mal */}
      <div className="flex gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        <Button
          size="sm"
          variant="destructive"
          onClick={onReproveClick} // <-- USA O NOVO HANDLER
          disabled={isPending}
        >
          Reprovar
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={onApproveClick} // <-- USA O NOVO HANDLER
          disabled={isPending}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Aprovar'}
        </Button>
      </div>

      <ReproveModal
        isOpen={showReproveModal}
        onClose={() => setShowReproveModal(false)}
        onSubmit={handleReprove}
        isPending={isPending}
      />
    </>
  );
}