// src/app/dashboard/trechos/[trechoId]/vistorias/_components/CreateVistoriaButton.tsx
'use client';

import { useState, useRef, useTransition } from 'react';
import { createVistoria } from '@/actions/vistorias';
import { CalendarPlus } from 'lucide-react';

export function CreateVistoriaButton({ trechoId }: { trechoId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleAction = (formData: FormData) => { // Remova async daqui
    startTransition(async () => { // Envolva a lógica em startTransition
      const result = await createVistoria(formData);
      if (result.error) {
        alert(result.error);
      } else {
        setIsOpen(false);
        formRef.current?.reset();
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
      >
        <CalendarPlus size={18} />
        Nova Vistoria
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/60 bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Registrar Nova Vistoria</h2>
            <form ref={formRef} action={handleAction}>
              <fieldset disabled={isPending}>
              <input type="hidden" name="trechoId" value={trechoId} />
              
              <div className="mb-4">
                <label htmlFor="dataVistoria" className="mb-2 block text-sm font-medium text-gray-700">
                  Data da Vistoria
                </label>
                <input
                  type="date"
                  id="dataVistoria"
                  name="dataVistoria"
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="motivo" className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <input
                  type="text"
                  id="motivo"
                  name="motivo"
                  placeholder="Ex: Vistoria de rotina"
                  required
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 transition hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-75 disabled:cursor-wait">
                    {isPending ? 'Salvar' : 'Salvar'}
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