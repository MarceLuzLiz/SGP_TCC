'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export interface BreadcrumbNavItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbNavItem[];
  backHref?: string;
  backLabel?: string;
  showBackButton?: boolean;
  className?: string;
}

export function BreadcrumbNav({
  items,
  backHref,
  backLabel = 'Voltar',
  showBackButton = true,
  className = '',
}: BreadcrumbNavProps) {
  const router = useRouter();

  // Se não foi passado backHref explicitamente, pega a página anterior na trilha do breadcrumb
  const previousItem = items.length > 1 ? items[items.length - 2] : null;
  const resolvedBackHref = backHref || previousItem?.href;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 mb-2 border-b border-border/40 ${className}`}
    >
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <div key={index} className="flex items-center gap-1.5 sm:gap-2">
                <BreadcrumbItem>
                  {item.href && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Link
                        href={item.href}
                        className="hover:text-primary transition-colors font-medium text-xs sm:text-sm text-muted-foreground"
                      >
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-[200px] sm:max-w-[350px] md:max-w-[500px]">
                      {item.label}
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </div>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {showBackButton && (
        resolvedBackHref ? (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto cursor-pointer border-slate-200 dark:border-slate-800"
          >
            <Link href={resolvedBackHref}>
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{backLabel}</span>
            </Link>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground self-start sm:self-auto cursor-pointer border-slate-200 dark:border-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{backLabel}</span>
          </Button>
        )
      )}
    </div>
  );
}
