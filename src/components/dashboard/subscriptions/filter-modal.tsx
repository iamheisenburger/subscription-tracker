"use client";

import { Button } from "@/components/ui/button";
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

const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'yearly'];

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal - slides up from bottom on mobile */}
      <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-[400px] sm:rounded-2xl sm:w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-xl font-bold">Filter & Sort</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  );
}
