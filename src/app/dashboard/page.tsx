// src/app/dashboard/page.tsx

// Ícones são ótimos para UI. Vamos instalar a biblioteca 'lucide-react'.
// No terminal, rode: npm install lucide-react
import { Users, Route } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    // O padding (p-8) virá do layout que criaremos a seguir
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">
        Dashboard do Fiscal
      </h1>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card Minhas Vias */}
        <Link href="/dashboard/vias" className="block transform rounded-lg bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Minhas Vias
              </h2>
              <p className="text-sm text-gray-500">
                Acessar vias e trechos atribuídos
              </p>
            </div>
          </div>
        </Link>


        {/* Card Usuário */}
        <Link href="/dashboard/profile" className="block transform rounded-lg bg-white p-6 shadow-md transition hover:-translate-y-1 hover:shadow-lg">
          
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Meu Perfil
              </h2>
              <p className="text-sm text-gray-500">
                Ver suas informações de perfil
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Aqui podemos adicionar mais informações no futuro, como um resumo de atividades */}
    </div>
  );
}