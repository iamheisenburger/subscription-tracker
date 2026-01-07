"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: 'streaming', label: 'Streaming', color: '#E63946' },
  { value: 'music', label: 'Music', color: '#F77F00' },
  { value: 'productivity', label: 'Productivity', color: '#06A77D' },
  { value: 'fitness', label: 'Fitness', color: '#2A9D8F' },
  { value: 'gaming', label: 'Gaming', color: '#7209B7' },
  { value: 'news', label: 'News', color: '#457B9D' },
  { value: 'cloud', label: 'Cloud Storage', color: '#3A86FF' },
  { value: 'other', label: 'Other', color: '#6C757D' },
];

const BILLING_CYCLES = ['weekly', 'monthly', 'yearly'];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'cost_high', label: 'Cost (High)' },
  { value: 'cost_low', label: 'Cost (Low)' },
  { value: 'renewal', label: 'Next Renewal' },
];

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  selectedCategories: Set<string>;
  onCategoryToggle: (category: string) => void;
  selectedCycles: Set<string>;
  onCycleToggle: (cycle: string) => void;
  onClearAll: () => void;
}

export function FilterModal({
  open,
  onOpenChange,
  sortBy,
  onSortChange,
  selectedCategories,
  onCategoryToggle,
  selectedCycles,
  onCycleToggle,
  onClearAll,
}: FilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] rounded-t-3xl sm:rounded-2xl p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-5 border-b border-border">
          <DialogTitle className="text-xl font-bold">Filter & Sort</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="p-5 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Sort By */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Sort By
            </p>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    sortBy === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryToggle(cat.value)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    selectedCategories.has(cat.value)
                      ? "text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                  style={{
                    backgroundColor: selectedCategories.has(cat.value) ? cat.color : undefined
                  }}
                >
                  {!selectedCategories.has(cat.value) && (
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Billing Cycle
            </p>
            <div className="flex flex-wrap gap-2">
              {BILLING_CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => onCycleToggle(cycle)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    selectedCycles.has(cycle)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border">
          <Button
            variant="outline"
            onClick={onClearAll}
            className="flex-1 rounded-xl h-12 font-semibold"
          >
            Clear All
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl h-12 font-semibold"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

