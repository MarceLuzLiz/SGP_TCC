import { Skeleton } from '@/components/ui/skeleton';

export default function GaleriaLoading() {
  return (
    <div className="space-y-6">
      {/* Skeleton do Breadcrumb e Título */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
      </div>

      {/* Skeleton dos Filtros */}
      <Skeleton className="h-24 w-full rounded-lg" />

      {/* Skeleton do Grid de Fotos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}