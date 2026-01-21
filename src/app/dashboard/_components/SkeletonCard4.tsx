// src/app/dashboard/_components/SkeletonCard.tsx

export function SkeletonCard() {
  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="animate-pulse flex space-x-4">
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}