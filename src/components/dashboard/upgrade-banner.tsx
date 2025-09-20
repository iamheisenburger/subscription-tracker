"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";
import Link from "next/link";

export function UpgradeBanner() {
  const { user } = useUser();
  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Don't show banner for premium users
  if (userData?.tier === "premium_user") {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Crown className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upgrade to Premium
              </h3>
              <p className="text-sm text-gray-600">
                Unlock unlimited subscriptions, advanced analytics, and more features.
              </p>
              <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Unlimited subscriptions
                </div>
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Advanced analytics
                </div>
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Export data
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="text-right mb-3">
              <div className="text-2xl font-bold text-gray-900">$9/mo</div>
              <div className="text-sm text-gray-500">or $7.50/mo annually</div>
            </div>
            <Link href="/pricing">
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Start 7-Day Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
