// src/app/dashboard/_components/SkeletonCard.tsx

export function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md animate-pulse">
      {/* Cabeçalho */}
      <div className="flex items-center mb-4 space-x-4">
        <div className="h-12 w-12 rounded-full bg-blue-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 bg-gray-200 rounded" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Corpo */}
      <div className="space-y-3 mt-4">
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-gray-200" />
          <div className="h-4 w-2/3 bg-gray-200 rounded" />
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 rounded-full bg-gray-200" />
          <div className="h-4 w-1/2 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
