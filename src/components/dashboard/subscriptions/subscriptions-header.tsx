"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download, Tag } from "lucide-react";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useUserTier } from "@/hooks/use-user-tier";
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
}: SubscriptionsHeaderProps) {
  const { isPremium } = useUserTier();
  const { user } = useUser();
  const categories = useQuery(api.categories.listCategories, user?.id ? { clerkId: user.id } : "skip");
  
  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-sans">
            Subscriptions
          </h1>
          <p className="text-muted-foreground font-sans">
            Manage all your subscriptions in one place
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <AddSubscriptionDialog>
            <Button className="font-sans">
              <Plus className="mr-2 h-4 w-4" />
              Add Subscription
            </Button>
          </AddSubscriptionDialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            className="pl-10 font-sans"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-sans">
                <Filter className="mr-2 h-4 w-4" />
                {activeFilter !== "all" || categoryFilter !== "all" ? "Filters applied" : "Filter"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-sans">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="font-sans" 
                onClick={() => onFilterChange("all")}
              >
                All Subscriptions
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-sans" 
                onClick={() => onFilterChange("active")}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="font-sans" 
                onClick={() => onFilterChange("inactive")}
              >
                Inactive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-sans">Filter by Billing</DropdownMenuLabel>
              {(["monthly","yearly","weekly"]).map((c) => (
                <DropdownMenuItem
                  key={c}
                  className="font-sans flex items-center gap-2"
                  onClick={() => (typeof window !== 'undefined' && (onBillingToggle && onBillingToggle(c)))}
                >
                  <span className={`h-2 w-2 rounded-full ${billingSet?.has(c) ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                  {c.charAt(0).toUpperCase()+c.slice(1)}
                </DropdownMenuItem>
              ))}
              {isPremium && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="font-sans flex items-center gap-2">
                    <Tag className="h-4 w-4" /> Categories
                  </DropdownMenuLabel>
                  <DropdownMenuItem 
                    className="font-sans" 
                    onClick={() => onCategoryChange("all")}
                  >
                    All Categories
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="font-sans" 
                    onClick={() => onCategoryChange("uncategorized")}
                  >
                    Uncategorized
                  </DropdownMenuItem>
                  {categories?.map((c) => (
                    <DropdownMenuItem 
                      key={c._id}
                      className="font-sans flex items-center gap-2"
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

          {isPremium ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="font-sans">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-sans">Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/api/export/csv" className="font-sans">Export as CSV</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href="/api/export/pdf" className="font-sans">Export as PDF</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" className="font-sans opacity-50 cursor-not-allowed" disabled>
              <Download className="mr-2 h-4 w-4" />
              Export (Premium)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
