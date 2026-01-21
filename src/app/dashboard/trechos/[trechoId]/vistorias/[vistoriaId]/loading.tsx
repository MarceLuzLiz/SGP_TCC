
export function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md animate-pulse">
      {/* Cabeçalho */}
      <div className="flex items-center justify-center items-al mb-4 space-x-4">
        <div className="h-10 w-8 bg-green-100 rounded-lg y-1/2 x-1/2 my-8" />
        
      </div>

      
    </div>
  );
}

export default function RFTListLoading() {
  return (
    <div>
      {/* Skeleton do Header e Filtros */}
      <div className="animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-4"></div>
        <div className="flex items-center justify-between mb-4"></div>
        <div className="p-4 bg-gray-50 rounded-lg border mb-8 h-24">
          <div className="h-9 w-1/2 bg-gray-200 rounded-md mb-2"></div>
          <div className="h-4 w-1/3 bg-gray-200 rounded-md"></div>
        </div>
        <div className="h-6 w-1/3 bg-gray-100 rounded-md mb-6"></div>
        
      </div>

      {/* Skeleton da Lista de Relatórios */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}