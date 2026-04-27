export default function AngularDashboardPage() {
  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[520px] min-w-0 flex-col gap-3">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Angular Dashboard
      </h1>

      <div className="min-h-0 flex-1">
        <iframe
          src="/angular/index.html"
          title="Angular Dashboard"
          className="h-full w-full border-none"
        />
      </div>
    </div>
  );
}
