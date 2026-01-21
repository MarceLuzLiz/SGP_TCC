// src/app/dashboard/vias/loading.tsx

import { CalendarPlus, ChevronRight } from 'lucide-react';
import { SkeletonCard } from '../../../_components/SkeletonCard4';

export default function ViasLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md"></div>      
      </div>
      

      <div className="flex items-center justify-between mb-6">
              <div className="h-8 w-1/4 mt-2 bg-gray-200 rounded-md"></div>
              <button className="flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2"
      >
        <CalendarPlus size={18} />
        Nova Vistoria
      </button>
            </div>

      
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1">
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