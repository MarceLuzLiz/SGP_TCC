import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function AprovacoesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-4 w-80 bg-muted/60 rounded-md" />
      </div>

      <div className="space-y-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-3 w-64 bg-muted/60 rounded" />
                </div>
                <div className="h-9 w-28 bg-muted rounded-md" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}