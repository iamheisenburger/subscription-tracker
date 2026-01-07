"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, SlidersHorizontal, Download } from "lucide-react";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import { FilterModal } from "./filter-modal";
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
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  selectedCycles: Set<string>;
  onCycleToggle: (cycle: string) => void;
  onClearFilters: () => void;
  filterCount: number;
}

export function SubscriptionsHeader({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryToggle,
  selectedCycles,
  onCycleToggle,
  onClearFilters,
  filterCount,
}: SubscriptionsHeaderProps) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const { isPlus, isAutomate, isFree } = useUserTier();
  const { user } = useUser();
  const subscriptions = useQuery(
    api.subscriptions.getUserSubscriptions,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const hasPlusFeatures = isPlus || isAutomate;
  const hasActiveFilters = filterCount > 0;

  return (
    <>
      <div className="bg-card rounded-2xl border border-border p-4">
        {/* Search and Filter Row */}
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search subscriptions..."
              className="pl-10 h-11 rounded-xl bg-muted border-0"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Filter Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterModalOpen(true)}
            className={cn(
              "h-11 w-11 rounded-xl shrink-0",
              hasActiveFilters && "bg-primary text-primary-foreground hover:bg-primary/90 border-primary"
            )}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>

          {/* Export Button - Desktop only */}
          {hasPlusFeatures && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden sm:flex rounded-xl h-11">
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
          )}

          {/* Add Button */}
          {isAutomate && (
            <AddSubscriptionDialog>
              <Button className="hidden sm:flex rounded-xl h-11">
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </AddSubscriptionDialog>
          )}

          {isPlus && (
            <AddSubscriptionDialog>
              <Button className="hidden sm:flex rounded-xl h-11">
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
                  <Button disabled className="hidden sm:flex rounded-xl h-11 opacity-60">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                );
              }
              return (
                <AddSubscriptionDialog>
                  <Button className="hidden sm:flex rounded-xl h-11">
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </AddSubscriptionDialog>
              );
            })()
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Filters:</span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(selectedCategories).map((cat) => (
                <button
                  key={cat}
                  onClick={() => onCategoryToggle(cat)}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  {cat} ×
                </button>
              ))}
              {Array.from(selectedCycles).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => onCycleToggle(cycle)}
                  className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  {cycle} ×
                </button>
              ))}
              {sortBy !== 'name' && (
                <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs">
                  Sort: {sortBy.replace('_', ' ')}
                </span>
              )}
            </div>
            <button
              onClick={onClearFilters}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <FilterModal
        open={filterModalOpen}
        onOpenChange={setFilterModalOpen}
        sortBy={sortBy}
        onSortChange={onSortChange}
        selectedCategories={selectedCategories}
        onCategoryToggle={onCategoryToggle}
        selectedCycles={selectedCycles}
        onCycleToggle={onCycleToggle}
        onClearAll={onClearFilters}
      />
    </>
  );
}
