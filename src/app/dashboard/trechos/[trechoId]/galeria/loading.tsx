import { SkeletonPhotoCard } from '../../../_components/SkeletonPhotoCard';

export default function GalleryLoading() {
  return (
    <div>
      {/* Skeleton do Header e Filtros */}
      <div className="mb-6 animate-pulse">     
        <div className="h-6 w-1/4 bg-gray-200 rounded-md mb-8"></div>

        <div className="h-8 w-1/3 bg-gray-200 rounded-md"></div>
        
      </div>
      <div className="mb-6 animate-pulse">
        <div className="h-8 w-1/6 bg-gray-200 rounded-md mb-8"></div>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="h-2  py-14 bg-gray-200 rounded-md"></div>
        </div>
      </div>

      {/* Grid de Skeletons das Fotos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
        <SkeletonPhotoCard />
      </div>
    </div>
  );
}