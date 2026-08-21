import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function TrechoDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back Link Skeleton */}
      <div className="h-4 w-40 bg-muted rounded" />

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-64 bg-muted rounded-md" />
          <div className="h-4 w-80 bg-muted/70 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-muted rounded-md" />
          <div className="h-9 w-36 bg-muted rounded-md" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Map and Approvals */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[400px] w-full bg-muted/40 flex items-center justify-center">
                <div className="text-sm font-medium text-muted-foreground/60">
                  Carregando mapa do trecho e laudos...
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-5 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 w-full bg-muted/40 rounded-lg border" />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: IGG & History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 w-full bg-muted/50 rounded-lg" />
              <div className="h-10 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}