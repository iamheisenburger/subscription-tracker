"use client";

import { useState } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SubscriptionsHeader } from "@/components/dashboard/subscriptions/subscriptions-header";
import { SubscriptionsTable } from "@/components/dashboard/subscriptions/subscriptions-table";
import { useUser } from "@clerk/nextjs";

export default function SubscriptionsPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <SubscriptionsHeader 
        search={search}
        onSearchChange={setSearch}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
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