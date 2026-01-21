
import { ChevronRight, Link } from 'lucide-react';
import { SkeletonCard } from '../../_components/SkeletonCard2';

export default function ViasLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-6 w-1/4 bg-gray-200 rounded-md"></div>

        <div className="h-8 w-1/3 mt-3 bg-gray-200 rounded-md mb-8"></div>
        
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
        {/* Renderiza vários skeletons para preencher a tela */}
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}