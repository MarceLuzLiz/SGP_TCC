// src/app/dashboard/vias/[viaId]/page.tsx

import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import { ChevronRight, Construction } from 'lucide-react';
import { parseStakeToMeters } from '@/lib/formatters';
import { formatKmToStakes } from '@/lib/formatters';

const prisma = new PrismaClient();

async function getViaDetails(viaId: string) {
  const via = await prisma.via.findUnique({
    where: { id: viaId },
    include: {
      trechos: true, // Inclui todos os trechos associados
    },
  });
  return via;
}

// O 'params' vem da URL dinâmica (o nome da pasta [viaId])
export default async function TrechosPage({ params }: { params: Promise<{ viaId: string }> }) {
  const resolvedParams = await params;
  const via = await getViaDetails(resolvedParams.viaId);

  if (!via) {
    return <div>Via não encontrada.</div>;
  }

  return (
  <div>
    {/* Breadcrumb para navegação */}
    <nav className="mb-6 flex items-center text-sm text-gray-500">
      <Link href="/dashboard/vias" className="hover:underline">
        Minhas Vias
      </Link>
      <ChevronRight className="mx-2 h-4 w-4" />
      <span className="font-semibold text-gray-700">{via.name}</span>
    </nav>

    <h1 className="mb-6 text-3xl font-bold text-gray-800">
      Trechos de {via.name}
    </h1>

    {via.trechos.length === 0 ? (
      <p className="text-gray-500">Nenhum trecho cadastrado para esta via.</p>
    ) : (
      <div className="space-y-4">
        {via.trechos.map((trecho) => {
          // --- NOVA LÓGICA DE CÁLCULO A PARTIR DO BANCO ---
          const extensaoKm = Math.abs(trecho.kmFinal - trecho.kmInicial);
          const estacaInicialFmt = formatKmToStakes(trecho.kmInicial);
          const estacaFinalFmt = formatKmToStakes(trecho.kmFinal);

          return (
            <Link
              key={trecho.id}
              href={`/dashboard/trechos/${trecho.id}`}
              className="block rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg hover:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Construction className="mr-4 h-6 w-6 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {trecho.nome}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Extensão: {extensaoKm.toFixed(2)} km
                      <span className="text-gray-400 mx-2">|</span>
                      Localizado entre a estaca {estacaInicialFmt} e a {estacaFinalFmt}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )}
  </div>
);

}