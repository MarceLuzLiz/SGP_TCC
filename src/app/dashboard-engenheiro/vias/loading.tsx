import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardFooter } from '@/components/ui/card';

export default function ViasLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted/60 rounded-md" />
        </div>
        <div className="h-10 w-40 bg-muted rounded-md" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-10 max-w-md bg-muted rounded-md" />

      {/* Cards Grid Skeleton */}
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="flex flex-col justify-between">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="h-5 w-3/4 bg-muted rounded" />
                <div className="flex gap-1">
                  <div className="h-7 w-7 bg-muted rounded-full" />
                  <div className="h-7 w-7 bg-muted rounded-full" />
                </div>
              </div>
              <div className="h-3 w-1/2 bg-muted/70 rounded" />
              <div className="space-y-1.5 pt-2">
                <div className="h-3 w-1/3 bg-muted/50 rounded" />
                <div className="h-3 w-1/4 bg-muted/50 rounded" />
              </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center bg-muted/20 py-2.5 px-4 border-t">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-8 w-24 bg-muted rounded" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}