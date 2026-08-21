import { Card, CardHeader } from '@/components/ui/card';

export default function RelatoriosLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-4 w-80 bg-muted/60 rounded-md" />
      </div>

      <div className="grid gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="h-5 w-3/4 bg-muted rounded" />
            <div className="h-3 w-1/2 bg-muted/60 rounded" />
            <div className="h-8 w-full bg-muted/40 rounded mt-4" />
          </Card>
        ))}
      </div>
    </div>
  );
}