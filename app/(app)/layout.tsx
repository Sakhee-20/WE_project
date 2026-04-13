import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AppLayout } from "@/components/layout/AppLayout";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileSidebarProvider } from "@/components/layout/mobile-sidebar-context";

export default async function AppRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingCompletedAt: true },
  });

  const needsOnboarding = !profile?.onboardingCompletedAt;

  const userLabel = session.user.name ?? session.user.email ?? "";

  return (
    <div className="flex min-h-screen min-w-0 flex-col overflow-x-hidden bg-zinc-50 dark:bg-zinc-950">
      <MobileSidebarProvider>
        <AppHeader userLabel={userLabel} />
        <OnboardingModal active={needsOnboarding} />
        <AppLayout>{children}</AppLayout>
      </MobileSidebarProvider>
    </div>
  );
}
