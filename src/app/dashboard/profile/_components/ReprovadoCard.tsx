// src/app/dashboard/profile/_components/ReprovadoCard.tsx
'use client';

import type { Relatorio, Trecho, Via, Vistoria } from '@prisma/client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { FilePenLine, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';
import { toast } from 'sonner';

type RelatorioCompleto = Relatorio & {
  trecho: Trecho & { via: Via };
  vistoria: Vistoria;
};

interface ReprovadoCardProps {
  relatorio: RelatorioCompleto;
}

export function ReprovadoCard({ relatorio }: ReprovadoCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza que deseja excluir este ${relatorio.tipo}?`)) {
      startTransition(async () => {
        const result = await deleteRelatorio(relatorio.id, relatorio.trechoId, relatorio.tipo);
        if (result.error) {
          toast.error(`Erro: ${result.error}`);
        } else {
          toast.success(result.success || `${relatorio.tipo} excluído com sucesso!`);
        }
      });
    }
  };

  const handleCorrect = (e: React.MouseEvent) => {
    e.stopPropagation();
    const editPath = `/dashboard/trechos/${relatorio.trechoId}/${relatorio.tipo.toLowerCase()}/${relatorio.id}/edit`;
    router.push(editPath);
  };

  const tipoLowerCase = relatorio.tipo.toLowerCase();
  const detailPath = `/dashboard/trechos/${relatorio.trechoId}/${tipoLowerCase}/${relatorio.id}`;

  return (
    <div
      onClick={() => router.push(detailPath)}
      className="group block p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 hover:border-rose-400 dark:hover:border-rose-800 transition-all cursor-pointer"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-rose-900 dark:text-rose-200">
              Seu {relatorio.tipo} de {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')} foi reprovado
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {relatorio.trecho.via.name} — {relatorio.trecho.nome}
            </p>
            {relatorio.motivoReprovacao && (
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-2 bg-rose-100/60 dark:bg-rose-900/40 p-2 rounded-lg">
                <span className="font-bold">Motivo:</span> {relatorio.motivoReprovacao}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={handleCorrect}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-purple-700 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors shadow-2xs"
            title="Corrigir"
          >
            <FilePenLine size={16} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-colors shadow-2xs disabled:opacity-50"
            title="Excluir"
          >
            {isPending ? <Loader2 size={16} className="animate-spin text-rose-600" /> : <Trash2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}