// src/app/dashboard/vias/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Route, MapPin, Milestone } from 'lucide-react';
import { formatKmToStakes } from '@/lib/formatters';

const prisma = new PrismaClient();

async function getViasDoUsuario(userId: string) {
  const assignments = await prisma.userViaAssignment.findMany({
    where: { userId: userId },
    include: {
      via: true, // Inclui os dados completos da via relacionada
    },
  });
  // Retorna apenas a lista de vias
  return assignments.map((assignment) => assignment.via);
}

export default async function ViasPage() {
  const session = await getServerSession(authOptions);

  // Se não houver sessão ou ID do usuário, redireciona para o login
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    redirect('/login');
  }

  // @ts-expect-error Corrigido
  const vias = await getViasDoUsuario(session.user.id);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Minhas Vias</h1>
      
      {vias.length === 0 ? (
        <p className="text-gray-500">Nenhuma via foi atribuída a você.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vias.map((via) => (
            <Link 
              href={`/dashboard/vias/${via.id}`} 
              key={via.id} 
              className="block transform rounded-lg bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center mb-4">
                <div className="rounded-full bg-blue-100 p-3">
                  <Route className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="ml-4 text-xl font-semibold text-gray-700">{via.name}</h2>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                  {via.bairro}, {via.municipio} - {via.estado}
                </p>
                <p className="flex items-center">
                  <Milestone className="mr-2 h-4 w-4 text-gray-400" />
                  Extensão: {via.extensaoKm} km ({formatKmToStakes(via.extensaoKm)} Estacas)
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}