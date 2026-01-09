"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { FilterModal } from "@/components/dashboard/subscriptions/filter-modal";
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { RecentSubscriptions } from "@/components/dashboard/recent-subscriptions";
import { UpcomingRenewals } from "@/components/dashboard/upcoming-renewals";
import { RenewalConfirmationSystem } from "@/components/dashboard/renewal-confirmation-system";
import { UpgradeBanner } from "@/components/dashboard/upgrade-banner";
import { DashboardFAB } from "@/components/dashboard/dashboard-fab";
import { cn } from "@/lib/utils";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

export function DashboardContent({ userId, userName }: DashboardContentProps) {
  const [search, setSearch] = useState("");
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCycles, setSelectedCycles] = useState<Set<string>>(new Set());

  const handleCategoryToggle = (category: string) => {
    const next = new Set(selectedCategories);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    setSelectedCategories(next);
  };

  const handleCycleToggle = (cycle: string) => {
    const next = new Set(selectedCycles);
    if (next.has(cycle)) next.delete(cycle);
    else next.add(cycle);
    setSelectedCycles(next);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSortBy("name");
    setSelectedCategories(new Set());
    setSelectedCycles(new Set());
  };

  const filterCount = selectedCategories.size + selectedCycles.size + (sortBy !== "name" ? 1 : 0);

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Mobile-Style Top Bar - Always Visible Add Button */}
      <div className="flex items-center gap-3 bg-card/95 backdrop-blur border border-border shadow-sm rounded-2xl sticky top-0 z-30 sm:p-4 p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            className="pl-10 h-12 rounded-xl bg-muted/40 border-0 text-base font-medium text-foreground"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setFilterModalOpen(true)}
          className={cn(
            "h-12 w-12 rounded-xl shrink-0 border-border/50 transition-all",
            filterCount > 0 && "bg-[#1F2937] dark:bg-white text-white dark:text-[#1F2937] border-[#1F2937] dark:border-white shadow-md"
          )}
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
        <AddSubscriptionDialog>
          <Button className="flex h-12 px-4 rounded-xl bg-[#1F2937] dark:bg-white hover:bg-[#1F2937]/90 dark:hover:bg-white/90 font-black text-white dark:text-[#1F2937] sm:px-6">
            <Plus className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </AddSubscriptionDialog>
      </div>

      {/* Welcome Header */}
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Hi, {userName}!
        </h1>
        <p className="text-muted-foreground font-semibold">
          Your subscriptions are looking good.
        </p>
      </div>

      {/* Main Content Area */}
      <div className="space-y-8">
        <RenewalConfirmationSystem />
        
        <UpgradeBanner />

        {/* Stats Overview - The massive Totals card */}
        <OverviewCards userId={userId} />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <RecentSubscriptions 
              userId={userId} 
              search={search}
              sortBy={sortBy}
              categories={Array.from(selectedCategories)}
              billing={Array.from(selectedCycles)}
            />
          </div>
          <div className="space-y-8">
            <UpcomingRenewals userId={userId} />
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        sortBy={sortBy}
        onSortChange={setSortBy}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        selectedCycles={selectedCycles}
        onCycleToggle={handleCycleToggle}
        onClearAll={handleClearFilters}
      />

      {/* FAB - Prominent floating button for mobile */}
      <DashboardFAB />
    </div>
  );
}
