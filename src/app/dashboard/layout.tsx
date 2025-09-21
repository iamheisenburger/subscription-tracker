import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav, SidebarNav } from "@/components/dashboard/bottom-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header - Desktop only, mobile has bottom nav */}
        <div className="hidden md:block">
          <DashboardHeader firstName={null} />
        </div>
        
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
