"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SubscriptionsHeader } from "@/components/dashboard/subscriptions/subscriptions-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubscriptionsTable } from "@/components/dashboard/subscriptions/subscriptions-table";
import { useUser } from "@clerk/nextjs";

export default function SubscriptionsPage() {
  const { user } = useUser();
  const params = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(params.get("q") || "");
  const [activeFilter, setActiveFilter] = useState(params.get("status") || "all");
  const [categoryFilter, setCategoryFilter] = useState(params.get("category") || "all");
  const [billingSet, setBillingSet] = useState<Set<string>>(new Set((params.get("billing") || "").split(",").filter(Boolean)));
  const [categorySet, setCategorySet] = useState<Set<string>>(new Set((params.get("categories") || "").split(",").filter(Boolean)));

  // URL sync
  const syncURL = (next: Partial<{ q: string; status: string; billing: string[]; categories: string[]; category: string }>) => {
    const sp = new URLSearchParams(params.toString());
    if (next.q !== undefined) sp.set("q", next.q);
    if (next.status !== undefined) sp.set("status", next.status);
    if (next.category !== undefined) sp.set("category", next.category);
    if (next.billing !== undefined) sp.set("billing", next.billing.join(","));
    if (next.categories !== undefined) sp.set("categories", next.categories.join(","));
    router.replace(`?${sp.toString()}`);
  };

  const billingArray = useMemo(() => Array.from(billingSet) as ("monthly"|"yearly"|"weekly")[], [billingSet]);
  const categoriesArray = useMemo(() => Array.from(categorySet), [categorySet]);

  const filterCount = (
    (activeFilter !== "all" ? 1 : 0) +
    billingSet.size +
    (categoryFilter !== "all" ? 1 : 0) +
    categorySet.size
  );

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <SubscriptionsHeader 
        search={search}
        onSearchChange={(v) => { setSearch(v); syncURL({ q: v }); }}
        activeFilter={activeFilter}
        onFilterChange={(v) => { setActiveFilter(v); syncURL({ status: v }); }}
        categoryFilter={categoryFilter}
        onCategoryChange={(v) => { setCategoryFilter(v); syncURL({ category: v }); }}
        filterCount={filterCount}
        billingSet={billingSet}
        onBillingToggle={(cycle) => {
          const next = new Set(billingSet);
          if (next.has(cycle)) {
            next.delete(cycle);
          } else {
            next.add(cycle);
          }
          setBillingSet(next);
          syncURL({ billing: Array.from(next) });
        }}
        categorySet={categorySet}
        onCategoryToggle={(name) => {
          const next = new Set(categorySet);
          if (next.has(name)) {
            next.delete(name);
          } else {
            next.add(name);
          }
          setCategorySet(next);
          syncURL({ categories: Array.from(next) });
        }}
      />

      {/* Applied filter chips */}
      {filterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          {activeFilter !== "all" && (
            <Badge className="font-sans bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
              Status: {activeFilter}
            </Badge>
          )}
          {Array.from(billingSet).map((b) => (
            <Badge key={`b-${b}`} className="font-sans bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
              Billing: {b}
            </Badge>
          ))}
          {categoryFilter !== "all" && (
            <Badge className="font-sans bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
              Category: {categoryFilter}
            </Badge>
          )}
          {Array.from(categorySet).map((c) => (
            <Badge key={`c-${c}`} className="font-sans bg-primary/10 text-primary border border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
              Category: {c}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 font-sans text-muted-foreground hover:text-foreground"
            onClick={() => {
              setSearch("");
              setActiveFilter("all");
              setCategoryFilter("all");
              const ns = new Set<string>();
              setBillingSet(ns);
              setCategorySet(new Set<string>());
              syncURL({ q: "", status: "all", billing: [], categories: [], category: "all" });
            }}
          >
            Clear all
          </Button>
        </div>
      )}
      <SubscriptionsTable 
        userId={user.id} 
        search={search}
        activeFilter={activeFilter}
        categoryFilter={categoryFilter}
        billing={billingArray}
        categories={categoriesArray}
      />
    </div>
  );
}