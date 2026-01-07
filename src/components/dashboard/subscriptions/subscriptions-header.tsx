"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download, Tag } from "lucide-react";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserTier } from "@/hooks/use-user-tier";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubscriptionsHeaderProps {
  search: string;
  onSearchChange: (search: string) => void;
  activeFilter: string; // all | active | inactive | monthly | yearly | weekly
  onFilterChange: (filter: string) => void;
  categoryFilter: string; // all | uncategorized | <name>
  onCategoryChange: (category: string) => void;
  billingSet?: Set<string>;
  onBillingToggle?: (cycle: string) => void;
  categorySet?: Set<string>;
  onCategoryToggle?: (name: string) => void;
  filterCount?: number;
}

export function SubscriptionsHeader({
  search,
  onSearchChange,
  activeFilter,
  onFilterChange,
  categoryFilter,
  onCategoryChange,
  billingSet,
  onBillingToggle,
  categorySet,
  onCategoryToggle,
  filterCount,
}: SubscriptionsHeaderProps) {
  const { isPlus, isAutomate, isFree } = useUserTier();
  const { user } = useUser();
  const categories = useQuery(api.categories.listCategories, user?.id ? { clerkId: user.id } : "skip");
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const hasPlusFeatures = isPlus || isAutomate;

  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            className="pl-10 rounded-xl bg-muted/40 border-border/50"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl border-border/50">
                <Filter className="mr-2 h-4 w-4" />
                {filterCount && filterCount > 0 ? `Filters (${filterCount})` : "Filter"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className={cn(
                  activeFilter === "all" && "bg-primary/10 text-primary"
                )} 
                onClick={() => onFilterChange("all")}
              >
                All Subscriptions
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={cn(
                  activeFilter === "active" && "bg-primary/10 text-primary"
                )} 
                onClick={() => onFilterChange("active")}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={cn(
                  activeFilter === "inactive" && "bg-primary/10 text-primary"
                )} 
                onClick={() => onFilterChange("inactive")}
              >
                Inactive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter by Billing</DropdownMenuLabel>
              {(["monthly","yearly","weekly"]).map((c) => (
                <DropdownMenuItem
                  key={c}
                  className={cn(
                    "flex items-center gap-2",
                    billingSet?.has(c) && "bg-primary/5"
                  )}
                  onClick={() => (typeof window !== 'undefined' && (onBillingToggle && onBillingToggle(c)))}
                >
                  <span className={`h-2 w-2 rounded-full ${billingSet?.has(c) ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  {c.charAt(0).toUpperCase()+c.slice(1)}
                </DropdownMenuItem>
              ))}
              {hasPlusFeatures && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Categories
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    className={cn(
                      categoryFilter === "all" && "bg-primary/10 text-primary"
                    )} 
                    onClick={() => onCategoryChange("all")}
                  >
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className={cn(
                      categoryFilter === "uncategorized" && "bg-primary/10 text-primary"
                    )} 
                    onClick={() => onCategoryChange("uncategorized")}
                  >
                    Uncategorized
                  </DropdownMenuItem>
                  {categories?.map((c) => (
                    <DropdownMenuItem 
                      key={c._id}
                      className={cn(
                        "flex items-center gap-2",
                        categorySet?.has(c.name) && "bg-primary/5"
                      )}
                      onClick={() => (typeof window !== 'undefined' && (onCategoryToggle && onCategoryToggle(c.name)))}
                    >
                      <span className={`h-2 w-2 rounded-full ${categorySet?.has(c.name) ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasPlusFeatures ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl border-border/50">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/export/csv">Export as CSV</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/export/pdf">Export as PDF</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="rounded-xl border-border/50 opacity-50 cursor-not-allowed" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export (Plus)
            </Button>
          )}

          {/* Add Subscription Button */}
          {isAutomate && (
            <AddSubscriptionDialog>
              <Button variant="outline" className="rounded-xl border-border/50">
                <Plus className="mr-2 h-4 w-4" />
                Add Manual
              </Button>
            </AddSubscriptionDialog>
          )}

          {isPlus && (
            <AddSubscriptionDialog>
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </AddSubscriptionDialog>
          )}

          {isFree && (
            (() => {
              const freeLimit = 3;
              const currentCount = subscriptions?.length ?? 0;
              const reachedLimit = currentCount >= freeLimit;

              if (reachedLimit) {
                return (
                  <Button disabled className="rounded-xl opacity-60 cursor-not-allowed">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                );
              }
              return (
                <AddSubscriptionDialog>
                  <Button className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </AddSubscriptionDialog>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
