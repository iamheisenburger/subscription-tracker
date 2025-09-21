"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function UserSync() {
  const { user, isLoaded } = useUser();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

  useEffect(() => {
    if (isLoaded && user) {
      // Automatically create/update user in Convex when they sign in
      createOrUpdateUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
      }).catch((error) => {
        console.error("Failed to sync user:", error);
      });
    }
  }, [isLoaded, user, createOrUpdateUser]);

  return null; // This component doesn't render anything
}