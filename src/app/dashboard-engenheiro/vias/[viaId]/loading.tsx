import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function ViaDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back Link Skeleton */}
      <div className="h-4 w-32 bg-muted rounded" />

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-9 w-80 bg-muted rounded-md" />
          <div className="h-4 w-60 bg-muted/70 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted rounded-md" />
          <div className="h-9 w-36 bg-muted rounded-md" />
        </div>
      </div>

      {/* Map & Sections Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-48 bg-muted rounded" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[500px] w-full bg-muted/40 flex items-center justify-center">
                <div className="text-sm font-medium text-muted-foreground/60">
                  Carregando mapa vetorial e estaqueamento...
                </div>
              </div>
              <div className="p-4 border-t bg-muted/20 space-y-3">
                <div className="h-4 w-1/3 bg-muted rounded" />
                <div className="h-6 w-full bg-muted/60 rounded" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trechos Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-40 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-4 w-16 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-36 bg-muted/60 rounded" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}