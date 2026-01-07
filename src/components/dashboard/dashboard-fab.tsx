"use client";

import { Plus } from "lucide-react";
import { AddSubscriptionDialog } from "./add-subscription-dialog";

export function DashboardFAB() {
  return (
    <div className="fixed bottom-24 right-6 z-40 lg:bottom-8">
      <AddSubscriptionDialog>
        <button className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all">
          <Plus className="w-7 h-7 text-primary-foreground stroke-[2.5px]" />
        </button>
      </AddSubscriptionDialog>
    </div>
  );
}

