// src/app/dashboard/trechos/[trechoId]/vistorias/_components/CreateVistoriaButton.tsx
'use client';

import { useState, useRef, useTransition } from 'react';
import { createVistoria } from '@/actions/vistorias';
import { CalendarPlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export function CreateVistoriaButton({ trechoId }: { trechoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      const result = await createVistoria(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Vistoria registrada com sucesso!');
        setIsOpen(false);
        formRef.current?.reset();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2 text-sm shadow-xs transition-colors"
      >
        <CalendarPlus size={18} />
        Nova Vistoria
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Registrar Nova Vistoria
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form ref={formRef} action={handleAction}>
              <fieldset disabled={isPending} className="space-y-4">
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
                    defaultValue={new Date().toISOString().split('T')[0]}
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
                    placeholder="Ex: Vistoria técnica de rotina"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
                  >
                    {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isPending ? 'Salvando...' : 'Salvar Vistoria'}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </>
  );
}