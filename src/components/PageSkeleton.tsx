/** Skeleton elegante mostrado enquanto rotas lazy carregam. */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-8 w-48 rounded-lg shimmer" />
        <div className="h-4 w-72 rounded shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 stagger-children">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}
