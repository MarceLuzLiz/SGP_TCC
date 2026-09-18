// src/app/dashboard/trechos/[trechoId]/vistorias/_components/RelatorioStatusCard.tsx
'use client';

import type { Relatorio } from '@prisma/client';
import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, FileCheck2, FilePenLine, Trash2 } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';
import { toast } from 'sonner';

interface RelatorioStatusCardProps {
  relatorio: Relatorio | undefined;
  tipo: 'RFT' | 'RDS';
  trechoId: string;
}

export function RelatorioStatusCard({ relatorio, tipo, trechoId }: RelatorioStatusCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza que deseja excluir este ${tipo}?`)) {
      startTransition(async () => {
        if (relatorio) {
          const result = await deleteRelatorio(relatorio.id, trechoId, tipo);
          if (result.error) {
            toast.error(result.error);
          } else {
            toast.success(result.success || `${tipo} excluído com sucesso!`);
          }
        }
      });
    }
  };

  const basePath = `/dashboard/trechos/${trechoId}/${tipo.toLowerCase()}`;

  if (!relatorio) {
    return (
      <Link
        href={`${basePath}/new`}
        className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 py-12 text-center transition-all hover:border-teal-500 hover:bg-teal-50/20 dark:hover:bg-teal-950/20 group"
      >
        <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs group-hover:scale-105 transition-transform mb-2">
          <PlusCircle className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
          Nenhum {tipo} encontrado
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Clique para criar um novo relatório
        </p>
      </Link>
    );
  }

  return (
    <div
      onClick={() => router.push(`${basePath}/${relatorio.id}`)}
      className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 py-12 text-center shadow-xs transition-all hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/10"
    >
      <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-2">
        <FileCheck2 className="h-6 w-6" />
      </div>
      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
        {tipo} Gerado
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">
        Criado em {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}
      </p>

      {relatorio.statusAprovacao === 'PENDENTE' && (
        <div className="absolute top-3 right-3 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link
            href={`${basePath}/${relatorio.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-lg transition-colors"
            title={`Editar ${tipo}`}
          >
            <FilePenLine size={16} />
          </Link>
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors disabled:opacity-50"
            title={`Excluir ${tipo}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
}