// src/app/dashboard/trechos/[trechoId]/vistorias/_components/VistoriaList.tsx
'use client';

import { useState } from 'react';
import type { Vistoria } from '@prisma/client';
import Link from 'next/link';
import { FilePenLine, Trash2 } from 'lucide-react';
import { updateVistoria, deleteVistoria } from '@/actions/vistorias';

interface VistoriaListProps {
  vistorias: Vistoria[];
  trechoId: string;
}

export function VistoriaList({ vistorias, trechoId }: VistoriaListProps) {
  const [editingVistoria, setEditingVistoria] = useState<Vistoria | null>(null);

  const handleEditClick = (vistoria: Vistoria) => {
    setEditingVistoria(vistoria);
  };

  const handleDeleteClick = async (vistoriaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta vistoria?')) {
      const result = await deleteVistoria(vistoriaId, trechoId);
      if (result.error) alert(`Erro: ${result.error}`);
      else alert(result.success);
    }
  };

  const handleUpdateAction = async (formData: FormData) => {
    const result = await updateVistoria(formData);
    if (result.error) alert(`Erro: ${result.error}`);
    else {
      alert(result.success);
      setEditingVistoria(null); // Fecha o modal
    }
  };

  return (
    <>
      <div className="rounded-lg bg-white shadow-md">
        <div className="p-4 border-b"><h2 className="text-lg font-semibold">{vistorias.length} vistorias registradas</h2></div>
        {vistorias.length > 0 ? (
          <ul className="divide-y">
            {vistorias.map((vistoria) => (
              // O <li> agora é o container principal do flexbox
              <li key={vistoria.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                {/* O <Link> agora envolve apenas a parte que deve navegar */}
                <Link href={`/dashboard/trechos/${trechoId}/vistorias/${vistoria.id}`} className="grow cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-800">{new Date(vistoria.dataVistoria).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
                    <p className="text-sm text-gray-600">{vistoria.motivo}</p>
                  </div>
                </Link>
                
                {/* Os botões agora são irmãos do Link, não filhos */}
                <div className="flex shrink-0 items-center space-x-2 pl-4">
                  <button onClick={() => handleEditClick(vistoria)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition"><FilePenLine size={18} /></button>
                  <button onClick={() => handleDeleteClick(vistoria.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-full transition"><Trash2 size={18} /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-center text-gray-500">Nenhuma vistoria registrada.</p>
        )}
      </div>

      {/* Modal de Edição */}
      {editingVistoria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500/60 bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-bold">Editar Vistoria</h2>
            <form action={handleUpdateAction}>
              <input type="hidden" name="vistoriaId" value={editingVistoria.id} />
              <input type="hidden" name="trechoId" value={trechoId} />
              <div className="mb-4">
                <label htmlFor="dataVistoria" className="mb-2 block text-sm font-medium">Data</label>
                <input type="date" id="dataVistoria" name="dataVistoria" required defaultValue={new Date(editingVistoria.dataVistoria).toISOString().split('T')[0]} className="w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="mb-6">
                <label htmlFor="motivo" className="mb-2 block text-sm font-medium">Motivo</label>
                <input type="text" id="motivo" name="motivo" required defaultValue={editingVistoria.motivo} className="w-full rounded-md border border-gray-300 p-2" />
              </div>
              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setEditingVistoria(null)} className="rounded-lg bg-gray-200 px-4 py-2 hover:bg-gray-300">Cancelar</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}