"use client";

import { Plus } from "lucide-react";
import { AddSubscriptionDialog } from "./add-subscription-dialog";

export function DashboardFAB() {
  return (
    <div className="fixed bottom-24 right-6 z-40 sm:bottom-10 sm:right-10">
      <AddSubscriptionDialog>
        <button className="group flex items-center gap-2 h-16 px-6 bg-[#1F2937] dark:bg-white text-white dark:text-[#1F2937] rounded-full shadow-2xl hover:shadow-[#1F2937]/20 dark:hover:shadow-white/20 hover:bg-[#1F2937]/95 dark:hover:bg-white/95 active:scale-95 transition-all">
          <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-[#1F2937]/10 flex items-center justify-center transition-colors group-hover:bg-white/20 dark:group-hover:bg-[#1F2937]/20">
            <Plus className="w-5 h-5 text-white dark:text-[#1F2937] stroke-[3px]" />
          </div>
          <span className="font-black text-base pr-2 tracking-tight">Add Subscription</span>
        </button>
      </AddSubscriptionDialog>
    </div>
  );
}
