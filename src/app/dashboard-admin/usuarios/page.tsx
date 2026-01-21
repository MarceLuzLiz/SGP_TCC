import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { getAllUsersForAdmin } from '@/lib/data/engenheiro'; // Ou @/lib/data/admin
// 1. IMPORTE AMBOS OS COMPONENTES
import { UserManagementClient, CreateUserForm } from './_components/UserManagementClient';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const users = await getAllUsersForAdmin();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna 1: Lista de Usuários */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5 text-primary" />
              Usuários do Sistema
            </CardTitle>
            <CardDescription>
              Suspenda, reative ou visualize todos os usuários cadastrados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagementClient users={users} />
          </CardContent>
        </Card>
      </div>

      {/* Coluna 2: Criar Novo Usuário */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Usuário</CardTitle>
            <CardDescription>
              Crie uma nova conta de Fiscal ou Engenheiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* 2. USE O COMPONENTE DIRETAMENTE */}
            <CreateUserForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}