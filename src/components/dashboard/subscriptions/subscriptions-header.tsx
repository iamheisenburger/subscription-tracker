"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter, Download } from "lucide-react";
import { AddSubscriptionDialog } from "@/components/dashboard/add-subscription-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SubscriptionsHeader() {
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
          />
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="font-sans">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-sans">Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-sans">All Subscriptions</DropdownMenuItem>
              <DropdownMenuItem className="font-sans">Active</DropdownMenuItem>
              <DropdownMenuItem className="font-sans">Cancelled</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="font-sans">Monthly</DropdownMenuItem>
              <DropdownMenuItem className="font-sans">Yearly</DropdownMenuItem>
              <DropdownMenuItem className="font-sans">Weekly</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" className="font-sans">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
