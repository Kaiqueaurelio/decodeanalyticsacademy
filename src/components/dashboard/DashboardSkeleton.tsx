import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-64 rounded-[2rem] bg-card border border-border/50 flex flex-col justify-end p-8 space-y-4">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>

      {/* Stats Bar Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-card border border-border/50 flex items-center p-4 gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Grid Header Skeleton */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Subjects Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
