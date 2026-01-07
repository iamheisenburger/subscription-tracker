"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-t-3xl sm:rounded-2xl p-0 gap-0 border-0 overflow-hidden bg-white [&>button]:hidden">
        {/* Header - Single Close Button */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-white sticky top-0 z-10">
          <div className="w-10" /> {/* Spacer */}
          <DialogTitle className="text-xl font-black text-[#1F2937]">Filter & Sort</DialogTitle>
          <button 
            onClick={() => onOpenChange(false)}
            className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-10 max-h-[70vh] overflow-y-auto bg-white custom-scrollbar pb-8">
          {/* Sort By */}
          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
              Sort By
            </p>
            <div className="flex flex-wrap gap-2.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={cn(
                    "px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2",
                    sortBy === option.value
                      ? "bg-[#1F2937] text-white border-[#1F2937] shadow-lg scale-[1.02]"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:border-[#1F2937]/20"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
              Categories
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => onCategoryToggle(cat.value)}
                  className={cn(
                    "px-6 py-3.5 rounded-full text-sm font-black transition-all border-2 flex items-center gap-3",
                    selectedCategories.has(cat.value)
                      ? "text-white shadow-xl scale-[1.05]"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:border-border"
                  )}
                  style={{
                    backgroundColor: selectedCategories.has(cat.value) ? cat.color : undefined,
                    borderColor: selectedCategories.has(cat.value) ? cat.color : undefined
                  }}
                >
                  {!selectedCategories.has(cat.value) && (
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-inner" 
                      style={{ backgroundColor: cat.color }}
                    />
                  )}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Cycle */}
          <div className="space-y-4">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] px-1">
              Billing Cycle
            </p>
            <div className="flex flex-wrap gap-2.5">
              {BILLING_CYCLES.map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => onCycleToggle(cycle)}
                  className={cn(
                    "px-6 py-3.5 rounded-2xl text-sm font-black transition-all border-2",
                    selectedCycles.has(cycle)
                      ? "bg-[#1F2937] text-white border-[#1F2937] shadow-lg scale-[1.02]"
                      : "bg-muted/30 text-muted-foreground border-transparent hover:border-[#1F2937]/20"
                  )}
                >
                  {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-border bg-white sticky bottom-0">
          <Button
            variant="outline"
            onClick={onClearAll}
            className="flex-1 rounded-2xl h-16 font-black text-base border-2 border-border/50 hover:bg-muted active:scale-95 transition-all"
          >
            Clear All
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-2xl h-16 font-black text-base bg-[#1F2937] text-white hover:bg-[#1F2937]/90 active:scale-[0.98] transition-all shadow-xl"
          >
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
