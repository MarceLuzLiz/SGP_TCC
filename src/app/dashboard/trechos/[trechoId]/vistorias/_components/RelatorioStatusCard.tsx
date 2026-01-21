// src/app/dashboard/trechos/[trechoId]/vistorias/_components/RelatorioStatusCard.tsx
'use client';

import type { Relatorio } from '@prisma/client';
import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation'; // NOVO: Importar o useRouter
import { PlusCircle, FileCheck2, FilePenLine, Trash2 } from 'lucide-react';
import { deleteRelatorio } from '@/actions/relatorios';

interface RelatorioStatusCardProps {
  relatorio: Relatorio | undefined;
  tipo: 'RFT' | 'RDS';
  trechoId: string;
}

export function RelatorioStatusCard({ relatorio, tipo, trechoId }: RelatorioStatusCardProps) {
  const router = useRouter(); // NOVO: Inicializar o router
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Impede que o clique acione o onClick do card principal

    if (window.confirm(`Tem certeza que deseja excluir este ${tipo}?`)) {
      startTransition(async () => {
        if (relatorio) {
          const result = await deleteRelatorio(relatorio.id, trechoId, tipo);
          if (result.error) alert(`Erro: ${result.error}`);
          else alert(result.success);
        }
      });
    }
  };

  const basePath = `/dashboard/trechos/${trechoId}/${tipo.toLowerCase()}`;
  const hoverColor = tipo === 'RFT' ? 'hover:border-blue-500' : 'hover:border-orange-500';

  if (!relatorio) {
    // ESTADO VAZIO: Continua sendo um Link, pois não há ações aninhadas.
    return (
      <Link href={`${basePath}/new`} className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 py-12 text-center transition ${hoverColor}`}>
        <PlusCircle className="h-10 w-10 text-gray-400" />
        <p className="mt-2 font-semibold text-gray-700">Nenhum {tipo} encontrado</p>
        <p className="text-sm text-gray-500">Clique para criar um novo</p>
      </Link>
    );
  }

  // MUDANÇA: O container principal agora é uma div com um onClick
  return (
    <div 
      onClick={() => router.push(`${basePath}/${relatorio.id}`)}
      className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-12 text-center shadow-md transition hover:shadow-lg ${hoverColor}`}
    >
      <FileCheck2 className="h-10 w-10 text-green-500" />
      <p className="mt-2 font-semibold text-gray-700">{tipo} Gerado</p>
      <p className="text-sm text-gray-500">Criado em {new Date(relatorio.createdAt).toLocaleDateString('pt-BR')}</p>

      {relatorio.statusAprovacao === 'PENDENTE' && (
        <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* O Link de edição continua sendo um Link, o que é correto */}
          <Link 
            href={`${basePath}/${relatorio.id}/edit`} 
            onClick={(e) => e.stopPropagation()} // Crucial: impede que o clique acione o onClick da div pai
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-full" 
            title={`Editar ${tipo}`}
          >
            <FilePenLine size={18} />
          </Link>
          <button 
            onClick={handleDelete} // handleDelete já tem stopPropagation
            disabled={isPending} 
            className="p-2 text-red-600 hover:bg-red-100 rounded-full" 
            title={`Excluir ${tipo}`}
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}