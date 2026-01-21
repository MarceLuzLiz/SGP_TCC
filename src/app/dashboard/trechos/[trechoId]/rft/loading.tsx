import { SkeletonListItem } from '../../../_components/SkeletonListItem';

export default function RFTListLoading() {
  return (
    <div>
      {/* Skeleton do Header e Filtros */}
      <div className="animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded-md mb-4"></div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-9 w-1/2 bg-gray-200 rounded-md"></div>
          <div className="h-10 w-40 bg-green-200 rounded-lg"></div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg border mb-6 h-28"></div>
        <div className="p-4 bg-gray-50 rounded-lg border mb-6 h-24"></div>
      </div>

      {/* Skeleton da Lista de Relatórios */}
      <div className="rounded-lg bg-white shadow-md divide-y">
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
        <SkeletonListItem />
      </div>
    </div>
  );
}