"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Trash2, Calendar, MoreHorizontal, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EditSubscriptionDialog } from "./edit-subscription-dialog";

// Category colors matching mobile app
const CATEGORY_COLORS: Record<string, string> = {
  streaming: '#E63946',
  music: '#F77F00',
  productivity: '#06A77D',
  fitness: '#2A9D8F',
  gaming: '#7209B7',
  news: '#457B9D',
  cloud: '#3A86FF',
  other: '#6C757D',
  entertainment: '#E63946',
  utilities: '#06A77D',
  software: '#3A86FF',
  education: '#457B9D',
  finance: '#10B981',
  health: '#2A9D8F',
  food: '#F77F00',
  shopping: '#7209B7',
  travel: '#3A86FF',
  social: '#E63946',
};

interface SubscriptionCardProps {
  subscription: {
    _id: Id<"subscriptions">;
    name: string;
    cost: number;
    currency: string;
    billingCycle: string;
    nextBillingDate: number;
    category?: string;
    status: string;
  };
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const { formatAmount, convertAmount } = useCurrency();

  const handleDelete = async () => {
    try {
      await deleteSubscription({ id: subscription._id });
      toast.success("Subscription deleted");
    } catch (error) {
      toast.error("Failed to delete subscription");
    }
  };

  const categoryColor = CATEGORY_COLORS[subscription.category?.toLowerCase() || 'other'] || CATEGORY_COLORS.other;
  
  const getCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      daily: '/day',
      weekly: '/week',
      monthly: '/month',
      yearly: '/year',
    };
    return labels[cycle] || '/month';
  };

  // Calculate days until renewal
  const getDaysUntilRenewal = (): number => {
    const now = new Date();
    const renewal = new Date(subscription.nextBillingDate);
    now.setHours(0, 0, 0, 0);
    renewal.setHours(0, 0, 0, 0);
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntilRenewal();
  const isUpcoming = daysUntil <= 3 && daysUntil >= 0;
  const renewalDate = new Date(subscription.nextBillingDate);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3 hover:bg-muted transition-colors">
        {/* Category dot */}
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0" 
          style={{ backgroundColor: categoryColor }}
        />
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">{subscription.name}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {subscription.category || 'Other'}
          </p>
        </div>

        {/* Renewal badge */}
        <div className="flex flex-col items-center">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
            isUpcoming ? "bg-destructive/10 text-destructive" : "bg-background text-muted-foreground"
          )}>
            <Calendar className="w-3 h-3" />
            {formatDate(renewalDate)}
          </div>
          <span className={cn(
            "text-[10px] mt-0.5",
            isUpcoming ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : daysUntil < 0 ? "Overdue" : `${daysUntil} days`}
          </span>
        </div>

        {/* Cost */}
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-base">
            {formatAmount(convertAmount(subscription.cost, subscription.currency))}
          </p>
          <p className="text-xs text-muted-foreground">{getCycleLabel(subscription.billingCycle)}</p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {subscription.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditSubscriptionDialog
        subscription={subscription}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
}
