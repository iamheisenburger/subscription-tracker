import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileBottomNav } from "@/components/dashboard/mobile-bottom-nav";

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
    <div className="min-h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:flex">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <main className="pb-20">
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}