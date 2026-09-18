// src/app/dashboard/trechos/[trechoId]/rds/_components/RDSList.tsx
'use client';

import type { Relatorio } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { FilePenLine, Trash2, CalendarDays, Loader2 } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';
import { toast } from 'sonner';

interface RDSListProps {
  relatorios: Relatorio[];
  trechoId: string;
}

export function RDSList({ relatorios, trechoId }: RDSListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent, relatorioId: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir este RDS?')) {
      startTransition(async () => {
        const result = await deleteRelatorio(relatorioId, trechoId, 'RDS');
        if (result.error) {
          toast.error(`Erro: ${result.error}`);
        } else {
          toast.success(result.success || 'RDS excluído com sucesso!');
        }
      });
    }
  };

  const handleEdit = (e: React.MouseEvent, relatorioId: string) => {
    e.stopPropagation();
    router.push(`/dashboard/trechos/${trechoId}/rds/${relatorioId}/edit`);
  };
  
  const statusStyles: { [key: string]: string } = {
    PENDENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    APROVADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
    REPROVADO: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    CORRIGIDO: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/40',
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
      <div className="p-4 md:px-6 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
          {relatorios.length} {relatorios.length === 1 ? 'RDS registrado' : 'RDSs registrados'}
        </h2>
      </div>

      {relatorios.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {relatorios.map((relatorio) => (
            <li 
              key={relatorio.id} 
              onClick={() => router.push(`/dashboard/trechos/${trechoId}/rds/${relatorio.id}`)}
              className="flex items-center justify-between p-4 md:px-6 group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
            >
              <div className="grow flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                    RDS de {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${statusStyles[relatorio.statusAprovacao] || 'bg-slate-100 text-slate-800'}`}>
                    {relatorio.statusAprovacao}
                  </span>
                </div>
              </div>

              {(relatorio.statusAprovacao === 'PENDENTE' || relatorio.statusAprovacao === 'REPROVADO') && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleEdit(e, relatorio.id)}
                    className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-xl transition-colors"
                    title="Editar RDS"
                  >
                    <FilePenLine size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, relatorio.id)}
                    disabled={isPending}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors disabled:opacity-50"
                    title="Excluir RDS"
                  >
                    {isPending ? <Loader2 size={16} className="animate-spin text-rose-600" /> : <Trash2 size={16} />}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-8 text-center text-sm text-muted-foreground">Nenhum RDS registrado.</p>
      )}
    </div>
  );
}