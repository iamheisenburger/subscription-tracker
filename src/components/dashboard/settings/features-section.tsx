"use client";

/**
 * Features Section Component
 * Comprehensive reference table of all Automate tier features
 * Shows what's included, current status, and how to activate features
 * UPDATED: Email-first detection strategy (removed bank dependencies)
 */

import { useUserTier } from "@/hooks/use-user-tier";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { CheckCircle2, Circle, Lock, Sparkles, Mail, Calendar, HelpCircle, FileText, TrendingUp } from "lucide-react";

interface FeatureItem {
  icon: React.ElementType;
  name: string;
  description: string;
  status: "active" | "requires-email" | "coming-soon" | "not-available";
  statusLabel: string;
}

export function FeaturesSection() {
  const { isAutomate, isLoading: isTierLoading } = useUserTier();
  const { user } = useUser();

  // Check if user has email connected
  const connections = useQuery(
    api.emailConnections.getUserConnections,
    user?.id ? { clerkUserId: user.id } : "skip"
  );

  const hasEmailConnected = connections && connections.length > 0;

  // Show loading state while tier data is being fetched
  if (isTierLoading || connections === undefined) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold font-sans">Features & Capabilities</h2>
          <p className="text-sm text-muted-foreground font-sans mt-1">Loading...</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Define all features with their status
  const features: FeatureItem[] = [
    // Active features (available to all tiers)
    {
      icon: FileText,
      name: "Manual Subscription Entry",
      description: "Add and track subscriptions manually",
      status: "active",
      statusLabel: "Active",
    },
    {
      icon: Calendar,
      name: "Calendar Export",
      description: "Export renewal dates to your calendar",
      status: isAutomate ? "active" : "not-available",
      statusLabel: isAutomate ? "Active" : "Automate tier only",
    },
    {
      icon: HelpCircle,
      name: "Cancel Assistant",
      description: "Step-by-step guides to cancel subscriptions",
      status: isAutomate ? "active" : "not-available",
      statusLabel: isAutomate ? "Active" : "Automate tier only",
    },
    {
      icon: FileText,
      name: "CSV/PDF Export",
      description: "Export your subscription data",
      status: isAutomate ? "active" : "not-available",
      statusLabel: isAutomate ? "Active" : "Automate tier only",
    },

    // Email-dependent features
    {
      icon: Mail,
      name: "Email Detection",
      description: "Automatically scan Gmail for subscription receipts and invoices",
      status: isAutomate ? (hasEmailConnected ? "active" : "requires-email") : "not-available",
      statusLabel: isAutomate ? (hasEmailConnected ? "Active" : "Connect email to activate") : "Automate tier only",
    },
    {
      icon: Sparkles,
      name: "Smart Parsing",
      description: "AI-powered extraction of subscription details from receipts",
      status: isAutomate ? (hasEmailConnected ? "active" : "requires-email") : "not-available",
      statusLabel: isAutomate ? (hasEmailConnected ? "Active" : "Connect email to activate") : "Automate tier only",
    },
    {
      icon: TrendingUp,
      name: "Price Tracking",
      description: "Monitor subscription price changes from email receipts",
      status: isAutomate ? (hasEmailConnected ? "active" : "requires-email") : "not-available",
      statusLabel: isAutomate ? (hasEmailConnected ? "Active" : "Connect email to activate") : "Automate tier only",
    },
    {
      icon: Calendar,
      name: "Renewal Detection",
      description: "Automatic detection of upcoming renewals from receipts",
      status: isAutomate ? (hasEmailConnected ? "active" : "requires-email") : "not-available",
      statusLabel: isAutomate ? (hasEmailConnected ? "Active" : "Connect email to activate") : "Automate tier only",
    },
  ];

  const getStatusIcon = (status: FeatureItem["status"]) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "requires-email":
        return <Circle className="h-4 w-4 text-orange-600" />;
      case "coming-soon":
        return <Circle className="h-4 w-4 text-muted-foreground" />;
      case "not-available":
        return <Lock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: FeatureItem["status"]) => {
    switch (status) {
      case "active":
        return "text-green-700 dark:text-green-400";
      case "requires-email":
        return "text-orange-700 dark:text-orange-400";
      case "coming-soon":
        return "text-muted-foreground";
      case "not-available":
        return "text-muted-foreground";
    }
  };

  return (
    <div className="p-6 border rounded-lg bg-card">
      <div className="mb-4">
        <h2 className="text-lg font-semibold font-sans">Features & Capabilities</h2>
        <p className="text-sm text-muted-foreground font-sans mt-1">
          {isAutomate
            ? "Complete overview of your Automate tier features and their status"
            : "See what's included in your current tier and what's available with Automate"
          }
        </p>
      </div>

      <div className="space-y-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.name}
              className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
            >
              <div className="rounded-full bg-primary/10 p-2 flex-shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium font-sans text-sm">{feature.name}</h3>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(feature.status)}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground font-sans">
                  {feature.description}
                </p>
              </div>
              <div className="flex-shrink-0 text-right">
                <span className={`text-xs font-medium font-sans ${getStatusColor(feature.status)}`}>
                  {feature.statusLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
