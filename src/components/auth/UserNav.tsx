import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Verifique se este é o caminho correto
import { UserMenu } from './UserMenu'; // Importa o Componente Cliente

export async function UserNav() {
  const session = await getServerSession(authOptions);
  
  // Passa a sessão (obtida no servidor) como prop para o cliente
  return <UserMenu session={session} />;
}