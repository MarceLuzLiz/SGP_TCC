export function SkeletonPhotoCard() {
  return (
    <div className="rounded-lg bg-white shadow-md">
      <div className="animate-pulse">
        {/* Espaço reservado para a imagem */}
        <div className="w-full h-48 bg-gray-200"></div>
        {/* Espaço reservado para o texto */}
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}