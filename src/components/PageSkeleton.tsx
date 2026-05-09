/** Skeleton elegante mostrado enquanto rotas lazy carregam. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8 animate-pulse">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3">
          <div className="h-10 w-64 rounded-2xl bg-muted/40" />
          <div className="h-4 w-96 rounded-xl bg-muted/20" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-muted/30 border border-border/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
