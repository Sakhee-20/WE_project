export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-zinc-100 px-4 py-10 dark:bg-zinc-950 sm:px-6">
      <div className="w-full max-w-[420px]">{children}</div>
    </div>
  );
}
