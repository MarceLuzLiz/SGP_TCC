export function SkeletonListItem() {
  return (
    <div className="flex items-center justify-between p-4 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-48"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
    </div>
  );
}