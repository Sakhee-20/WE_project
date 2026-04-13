import { Skeleton } from "@/components/ui/skeleton";

export default function AppSegmentLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-0 py-1 motion-safe:animate-fade-in sm:space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-9 w-56 max-w-[85%] rounded-md" />
        <Skeleton className="h-4 w-full max-w-md rounded-md" />
        <Skeleton className="h-4 w-full max-w-sm rounded-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-32 rounded-2xl sm:h-36"
            shimmer={i % 2 === 0}
          />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40 rounded-md" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[4.5rem] w-full rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-32 rounded-md" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
