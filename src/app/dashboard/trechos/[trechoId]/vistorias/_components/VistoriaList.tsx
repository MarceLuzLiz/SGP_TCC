// src/app/dashboard/trechos/[trechoId]/vistorias/_components/VistoriaList.tsx
'use client';

import { useState } from 'react';
import type { Vistoria } from '@prisma/client';
import Link from 'next/link';
import { FilePenLine, Trash2, Calendar, X, Loader2 } from 'lucide-react';
import { updateVistoria, deleteVistoria } from '@/actions/vistorias';
import { toast } from 'sonner';

interface VistoriaListProps {
  vistorias: Vistoria[];
  trechoId: string;
}

export function VistoriaList({ vistorias, trechoId }: VistoriaListProps) {
  const [editingVistoria, setEditingVistoria] = useState<Vistoria | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditClick = (vistoria: Vistoria) => {
    setEditingVistoria(vistoria);
  };

  const handleDeleteClick = async (vistoriaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta vistoria?')) {
      setDeletingId(vistoriaId);
      try {
        const result = await deleteVistoria(vistoriaId, trechoId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success(result.success || 'Vistoria excluída com sucesso!');
        }
      } catch {
        toast.error('Falha ao excluir vistoria.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleUpdateAction = async (formData: FormData) => {
    setIsUpdating(true);
    try {
      const result = await updateVistoria(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success || 'Vistoria atualizada com sucesso!');
        setEditingVistoria(null);
      }
    } catch {
      toast.error('Falha ao atualizar vistoria.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-slate-200/90 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="p-4 md:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {vistorias.length} {vistorias.length === 1 ? 'vistoria registrada' : 'vistorias registradas'}
          </h2>
        </div>

        {vistorias.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {vistorias.map((vistoria) => (
              <li
                key={vistoria.id}
                className="flex items-center justify-between p-4 md:px-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
              >
                <Link
                  href={`/dashboard/trechos/${trechoId}/vistorias/${vistoria.id}`}
                  className="grow cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                        Vistoria de {new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {vistoria.motivo}
                      </p>
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center space-x-1 pl-4">
                  <button
                    onClick={() => handleEditClick(vistoria)}
                    className="p-2 text-slate-500 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/60 rounded-xl transition-colors"
                    title="Editar vistoria"
                  >
                    <FilePenLine size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(vistoria.id)}
                    disabled={deletingId === vistoria.id}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors disabled:opacity-50"
                    title="Excluir vistoria"
                  >
                    {deletingId === vistoria.id ? (
                      <Loader2 size={16} className="animate-spin text-rose-600" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma vistoria registrada para este trecho.
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingVistoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Editar Vistoria
              </h2>
              <button
                onClick={() => setEditingVistoria(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form action={handleUpdateAction} className="space-y-4">
              <input type="hidden" name="vistoriaId" value={editingVistoria.id} />
              <input type="hidden" name="trechoId" value={trechoId} />

              <div>
                <label
                  htmlFor="dataVistoria"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Data da Vistoria
                </label>
                <input
                  type="date"
                  id="dataVistoria"
                  name="dataVistoria"
                  required
                  defaultValue={new Date(editingVistoria.dataVistoria).toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label
                  htmlFor="motivo"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  Motivo / Descrição
                </label>
                <input
                  type="text"
                  id="motivo"
                  name="motivo"
                  required
                  defaultValue={editingVistoria.motivo}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingVistoria(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                >
                  {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}