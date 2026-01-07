"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SubscriptionsHeader } from "@/components/dashboard/subscriptions/subscriptions-header";
import { SubscriptionsTable } from "@/components/dashboard/subscriptions/subscriptions-table";
import { useUser } from "@clerk/nextjs";

export default function SubscriptionsPage() {
  const { user } = useUser();
  const params = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(params.get("q") || "");
  const [sortBy, setSortBy] = useState(params.get("sort") || "name");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set((params.get("categories") || "").split(",").filter(Boolean))
  );
  const [selectedCycles, setSelectedCycles] = useState<Set<string>>(
    new Set((params.get("billing") || "").split(",").filter(Boolean))
  );

  const syncURL = (next: Partial<{ q: string; sort: string; billing: string[]; categories: string[] }>) => {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) sp.set("q", next.q);
    if (next.sort !== undefined) sp.set("sort", next.sort);
    if (next.billing !== undefined) sp.set("billing", next.billing.join(","));
    if (next.categories !== undefined) sp.set("categories", next.categories.join(","));
    router.replace(`?${sp.toString()}`);
  };

  const handleCategoryToggle = (category: string) => {
    const next = new Set(selectedCategories);
    if (next.has(category)) {
      next.delete(category);
    } else {
      next.add(category);
    }
    setSelectedCategories(next);
    syncURL({ categories: Array.from(next) });
  };

  const handleCycleToggle = (cycle: string) => {
    const next = new Set(selectedCycles);
    if (next.has(cycle)) {
      next.delete(cycle);
    } else {
      next.add(cycle);
    }
    setSelectedCycles(next);
    syncURL({ billing: Array.from(next) });
  };

  const handleClearFilters = () => {
    setSearch("");
    setSortBy("name");
    setSelectedCategories(new Set());
    setSelectedCycles(new Set());
    syncURL({ q: "", sort: "name", billing: [], categories: [] });
  };

  const filterCount = selectedCategories.size + selectedCycles.size + (sortBy !== "name" ? 1 : 0);

  const billingArray = useMemo(() => Array.from(selectedCycles) as ("monthly"|"yearly"|"weekly")[], [selectedCycles]);
  const categoriesArray = useMemo(() => Array.from(selectedCategories), [selectedCategories]);

  if (!user?.id) {
    return (
      <div className="space-y-6">
        <div className="bg-card rounded-2xl p-6 border border-border animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-2" />
          <div className="h-4 bg-muted rounded w-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Mobile app style */}
      <div className="bg-card rounded-2xl p-6 border border-border">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Subscriptions</h1>
        <p className="text-muted-foreground text-sm">
          View and manage all your subscriptions.
        </p>
      </div>

      {/* Search and Filters */}
      <SubscriptionsHeader 
        search={search}
        onSearchChange={(v) => { setSearch(v); syncURL({ q: v }); }}
        sortBy={sortBy}
        onSortChange={(v) => { setSortBy(v); syncURL({ sort: v }); }}
        selectedCategories={selectedCategories}
        onCategoryToggle={handleCategoryToggle}
        selectedCycles={selectedCycles}
        onCycleToggle={handleCycleToggle}
        onClearFilters={handleClearFilters}
        filterCount={filterCount}
      />

      {/* Subscriptions List */}
      <div className="bg-card rounded-2xl border border-border">
        <SubscriptionsTable 
          userId={user.id} 
          search={search}
          sortBy={sortBy}
          billing={billingArray}
          categories={categoriesArray}
        />
      </div>
    </div>
  );
}
