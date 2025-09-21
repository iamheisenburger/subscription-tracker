import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsContent } from "@/components/dashboard/settings/settings-content";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const safeUser = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        emailAddresses: user.emailAddresses?.map((e) => ({ emailAddress: e.emailAddress })) ?? [],
        createdAt: user.createdAt,
      }
    : null;

  return <SettingsContent user={safeUser} />;
}