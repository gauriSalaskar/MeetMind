export function SkeletonCard({ className = "" }) {
  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      <div className="skeleton h-4 w-1/3 rounded mb-4" />
      <div className="skeleton h-3 w-full rounded mb-2" />
      <div className="skeleton h-3 w-5/6 rounded mb-2" />
      <div className="skeleton h-3 w-2/3 rounded" />
    </div>
  );
}

export function SkeletonContactCard() {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className="skeleton w-12 h-12 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-1/2 rounded" />
        <div className="skeleton h-3 w-1/3 rounded" />
      </div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="skeleton h-3 w-1/2 rounded mb-3" />
      <div className="skeleton h-8 w-1/3 rounded" />
    </div>
  );
}

export function SkeletonGrid({ count = 4, Component = SkeletonContactCard }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
