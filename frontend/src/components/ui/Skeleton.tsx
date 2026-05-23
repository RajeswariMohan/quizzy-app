import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-gray-200/80', className)} />;
}

export function QuestionSkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-gray-100 p-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
