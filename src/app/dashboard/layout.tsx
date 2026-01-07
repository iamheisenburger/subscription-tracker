import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/navigation/sidebar";
import { DashboardHeader } from "@/components/dashboard/navigation/header";
import { MobileNav } from "@/components/dashboard/navigation/mobile-nav";
import { UserSync } from "@/components/user-sync";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-muted">
      <UserSync />
      {/* Desktop Layout */}
      <div className="hidden lg:flex">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto bg-muted">
            <div className="container max-w-4xl mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <DashboardHeader />
        <main className="pb-24 px-4 pt-4 bg-muted min-h-screen">
          <div className="max-w-lg mx-auto">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
