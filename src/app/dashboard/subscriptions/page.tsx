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

  // Derived arrays (may be used by future chunks)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const billingArray = useMemo(() => Array.from(billingSet) as ("monthly"|"yearly"|"weekly")[], [billingSet]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const categoriesArray = useMemo(() => Array.from(categorySet), [categorySet]);

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
        billingSet={billingSet}
        onBillingToggle={(cycle) => {
          const next = new Set(billingSet);
          next.has(cycle) ? next.delete(cycle) : next.add(cycle);
          setBillingSet(next);
          syncURL({ billing: Array.from(next) });
        }}
        categorySet={categorySet}
        onCategoryToggle={(name) => {
          const next = new Set(categorySet);
          next.has(name) ? next.delete(name) : next.add(name);
          setCategorySet(next);
          syncURL({ categories: Array.from(next) });
        }}
      />
      <SubscriptionsTable 
        userId={user.id} 
        search={search}
        activeFilter={activeFilter}
        categoryFilter={categoryFilter}
      />
    </div>
  );
}