import { Card, CardHeader } from '@/components/ui/card';

export default function EngenheiroHomeLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted rounded-md" />
        <div className="h-4 w-72 bg-muted/60 rounded-md" />
      </div>


      <div className="grid gap-6 pt-4 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex h-32 flex-col justify-center">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0">
              <div className="rounded-full bg-muted h-16 w-16 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-5 w-36 bg-muted rounded" />
                <div className="h-3 w-56 bg-muted/60 rounded" />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}