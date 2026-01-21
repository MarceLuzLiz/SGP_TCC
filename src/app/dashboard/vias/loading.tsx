// src/app/dashboard/vias/loading.tsx

import { SkeletonCard } from '../_components/SkeletonCard';

export default function ViasLoading() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-800">Minhas Vias</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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