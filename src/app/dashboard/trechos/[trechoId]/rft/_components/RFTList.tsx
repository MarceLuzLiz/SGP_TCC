// src/app/dashboard/trechos/[trechoId]/rft/_components/RFTList.tsx
'use client';

import type { Relatorio } from '@prisma/client';
import { useRouter } from 'next/navigation'; // Importar useRouter
import { useTransition } from 'react';
import { FilePenLine, Trash2 } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';

interface RFTListProps {
  relatorios: Relatorio[];
  trechoId: string;
}

export function RFTList({ relatorios, trechoId }: RFTListProps) {
  const router = useRouter(); // Inicializar o router
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent, relatorioId: string) => {
    e.stopPropagation(); // Impede a navegação
    if (window.confirm('Tem certeza que deseja excluir este RFT?')) {
      startTransition(async () => {
        const result = await deleteRelatorio(relatorioId, trechoId, 'RFT');
        if (result.error) alert(`Erro: ${result.error}`);
        else alert(result.success);
      });
    }
  };
  
  const handleEdit = (e: React.MouseEvent, relatorioId: string) => {
    e.stopPropagation(); // Impede a navegação
    router.push(`/dashboard/trechos/${trechoId}/rft/${relatorioId}/edit`);
  };

  const statusStyles: { [key: string]: string } = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    APROVADO: 'bg-green-100 text-green-800',
    REPROVADO: 'bg-red-100 text-red-800',
    CORRIGIDO: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="p-4 border-b"><h2 className="text-lg font-semibold">{relatorios.length} RFTs registrados</h2></div>
      {relatorios.length > 0 ? (
        <ul className="divide-y">
          {relatorios.map((relatorio) => (
            <li 
              key={relatorio.id} 
              onClick={() => router.push(`/dashboard/trechos/${trechoId}/rft/${relatorio.id}`)}
              className="flex items-center justify-between p-4 group hover:bg-gray-50 cursor-pointer"
            >
              <div className="grow">
                <p className="font-semibold text-gray-800">RFT de {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</p>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[relatorio.statusAprovacao]}`}>
                  {relatorio.statusAprovacao}
                </span>
              </div>
              {(relatorio.statusAprovacao === 'PENDENTE' || relatorio.statusAprovacao === 'REPROVADO') && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => handleEdit(e, relatorio.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><FilePenLine size={18} /></button>
                  <button onClick={(e) => handleDelete(e, relatorio.id)} disabled={isPending} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><Trash2 size={18} /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-4 text-center text-gray-500">Nenhum RFT registrado.</p>
      )}
    </div>
  );
}