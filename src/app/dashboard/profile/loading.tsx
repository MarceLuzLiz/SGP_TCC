export default function ProfileLoading() {
  return (
    <div className="animate-pulse">
      {/* Skeleton do Título da Página */}
      <div className="h-9 w-1/3 bg-gray-200 rounded-md mb-8"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- Skeleton da Coluna da Esquerda --- */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Skeleton do Card de Usuário */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full h-14 w-14"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-40"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
              
            </div>
            <div className="p-3 mt-2 bg-blue-100 rounded-3xl w-18"></div>
          </div>
          

          {/* Skeleton do Card de Vias */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Skeleton do Card de Vistorias */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-5 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded"></div>
              <div className="h-5 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>

        {/* --- Skeleton da Coluna da Direita --- */}
        <div className="lg:col-span-2 space-y-8">

          {/* Skeleton do Card de Status */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                </div>
              </div>
              <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                  <div className="p-4 bg-gray-200 rounded-lg h-20"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Skeleton do Card de Ações/Notificações */}
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-200 rounded-lg h-16"></div>
              <div className="p-3 bg-gray-200 rounded-lg h-16"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}