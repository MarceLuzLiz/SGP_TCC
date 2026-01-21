import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { PrismaClient } from '@prisma/client';
import { User, Map, ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';
import { ReprovadoCard } from './_components/ReprovadoCard';

const prisma = new PrismaClient();

async function getProfileData(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  const assignedVias = await prisma.userViaAssignment.findMany({
    where: { userId },
    include: { via: true },
  });

  const vistorias = await prisma.vistoria.findMany({
    where: { userId },
    orderBy: { dataVistoria: 'desc' },
    take: 5,
  });

  const relatorios = await prisma.relatorio.findMany({
    where: { userId },
    include: {
      trecho: { include: { via: true } },
      vistoria: true,
    },
    orderBy: { updatedAt: 'desc' }, // Ordenar por 'updatedAt' para ver as aprovações mais recentes
  });

  // --- ESTATÍSTICAS ATUALIZADAS ---
  const rftStats = {
    pendentes: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'PENDENTE').length,
    aprovados: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'APROVADO').length,
    reprovados: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'REPROVADO').length,
    corrigidos: relatorios.filter(r => r.tipo === 'RFT' && r.statusAprovacao === 'CORRIGIDO').length, // NOVO
  };
  const rdsStats = {
    pendentes: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'PENDENTE').length,
    aprovados: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'APROVADO').length,
    reprovados: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'REPROVADO').length,
    corrigidos: relatorios.filter(r => r.tipo === 'RDS' && r.statusAprovacao === 'CORRIGIDO').length, // NOVO
  };

  const relatoriosReprovados = relatorios.filter(r => r.statusAprovacao === 'REPROVADO');
  
  // --- NOVA LISTA PARA NOTIFICAÇÕES DE APROVAÇÃO ---
  const relatoriosAprovados = relatorios
    .filter(r => r.statusAprovacao === 'APROVADO')
    .slice(0, 3); // Pega apenas os 3 mais recentes

  return {
    user,
    vias: assignedVias.map(a => a.via),
    vistorias,
    rftStats,
    rdsStats,
    relatoriosReprovados,
    relatoriosAprovados, // Retorna a nova lista
  };
}

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  // @ts-expect-error Corrigido
  if (!session?.user?.id) {
    redirect('/login');
  }

  // @ts-expect-error Corrigido
  const data = await getProfileData(session.user.id);
  
  if (!data.user) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Painel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Coluna da Esquerda (Perfil e Vias) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Card de Informações do Usuário */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full"><User className="h-6 w-6 text-blue-600" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{data.user.name}</h2>
                <p className="text-sm text-gray-500">{data.user.email}</p>
              </div>
            </div>
            <p className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-500 text-white inline-block">{data.user.role}</p>
          </div>

          {/* Card de Vias Atribuídas */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4"><Map className="h-6 w-6 text-green-600" /><h2 className="text-xl font-bold text-gray-800">Minhas Vias</h2></div>
            {data.vias.length > 0 ? (
              <ul className="space-y-3 text-sm">{data.vias.map(via => <li key={via.id} className="p-2 bg-gray-50 rounded-md">{via.name}</li>)}</ul>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma via atribuída a você.</p>
            )}
          </div>

          {/* Card de Vistorias Recentes (MOVIDO PARA CÁ) */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-3 mb-4"><ClipboardList className="h-6 w-6 text-purple-600" /><h2 className="text-xl font-bold text-gray-800">Vistorias Recentes</h2></div>
            <ul className="space-y-3 text-sm">{data.vistorias.map(v => (
              <li key={v.id} className="p-2 bg-gray-50 rounded-md">Vistoria em {new Date(v.dataVistoria).toLocaleDateString('pt-BR')} - {v.motivo}</li>
            ))}</ul>
          </div>


        </div>

        {/* Coluna da Direita (Status e Atividades) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Card de Status dos Relatórios ATUALIZADO */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Status dos Relatórios</h2>
            <div className="space-y-4">
              {/* Status RFT */}
              <div>
                <p className="font-semibold text-gray-600">RFT</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-1">
                  <div className="p-4 bg-yellow-50 rounded-lg"><p className="text-2xl font-bold text-yellow-600">{data.rftStats.pendentes}</p><p className="text-sm font-medium text-yellow-700">Pendentes</p></div>
                  <div className="p-4 bg-orange-50 rounded-lg"><p className="text-2xl font-bold text-orange-600">{data.rftStats.corrigidos}</p><p className="text-sm font-medium text-orange-700">Corrigidos</p></div>
                  <div className="p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{data.rftStats.aprovados}</p><p className="text-sm font-medium text-green-700">Aprovados</p></div>
                  <div className="p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-600">{data.rftStats.reprovados}</p><p className="text-sm font-medium text-red-700">Reprovados</p></div>
                </div>
              </div>
              {/* Status RDS */}
              <div>
                <p className="font-semibold text-gray-600">RDS</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-1">
                   <div className="p-4 bg-yellow-50 rounded-lg"><p className="text-2xl font-bold text-yellow-600">{data.rdsStats.pendentes}</p><p className="text-sm font-medium text-yellow-700">Pendentes</p></div>
                   <div className="p-4 bg-orange-50 rounded-lg"><p className="text-2xl font-bold text-orange-600">{data.rdsStats.corrigidos}</p><p className="text-sm font-medium text-orange-700">Corrigidos</p></div>
                   <div className="p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-600">{data.rdsStats.aprovados}</p><p className="text-sm font-medium text-green-700">Aprovados</p></div>
                   <div className="p-4 bg-red-50 rounded-lg"><p className="text-2xl font-bold text-red-600">{data.rdsStats.reprovados}</p><p className="text-sm font-medium text-red-700">Reprovados</p></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Card de Ações Necessárias (Reprovados) */}
          {data.relatoriosReprovados.length > 0 && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><AlertTriangle className="text-red-500" /> Ações Necessárias</h3>
              <div className="space-y-4">{data.relatoriosReprovados.map(r => <ReprovadoCard key={r.id} relatorio={r} />)}</div>
            </div>
          )}

          {/* NOVO CARD: Notificações de Aprovação */}
          {data.relatoriosAprovados.length > 0 && (
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2"><CheckCircle className="text-green-500" /> Relatórios Aprovados</h3>
              <div className="space-y-4">{data.relatoriosAprovados.map(r => (
                  <Link key={r.id} href={`/dashboard/trechos/${r.trechoId}/${r.tipo.toLowerCase()}/${r.id}`} className="block group p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg hover:bg-green-100 transition">
                    <p className="font-semibold text-green-800">Seu {r.tipo} de {new Date(r.vistoria.dataVistoria).toLocaleDateString('pt-BR')} foi aprovado!</p>
                    <p className="text-xs text-gray-500">{r.trecho.via.name} - {r.trecho.nome}</p>
                  </Link>
              ))}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}