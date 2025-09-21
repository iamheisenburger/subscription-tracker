import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-sans">
              Welcome back, {user?.firstName || "there"}!
            </h1>
            <p className="text-muted-foreground font-sans mt-2">
              Dashboard is being rebuilt from scratch.
            </p>
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
        
        <div className="bg-card border rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold font-sans mb-4">
            Dashboard Under Construction
          </h2>
          <p className="text-muted-foreground font-sans">
            The dashboard is being completely rebuilt with a better architecture.
            Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
