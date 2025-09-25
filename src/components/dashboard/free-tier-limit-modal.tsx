"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle as Check } from "lucide-react";
import Link from "next/link";

interface FreeTierLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  limit: number;
}

export function FreeTierLimitModal({ 
  open, 
  onOpenChange, 
  currentCount, 
  limit 
}: FreeTierLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center font-sans">
            Free Plan Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center font-sans">
            You&apos;ve reached your limit of {limit} subscriptions. Upgrade to Premium to add unlimited subscriptions.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-sans">Current subscriptions:</span>
              <span className="font-semibold font-sans">{currentCount} / {limit}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium font-sans">Upgrade to Premium and get:</h4>
            <ul className="space-y-2">
              {[
                "Unlimited subscriptions",
                "Advanced spending analytics",
                "Export data to CSV/PDF",
                "Custom categories",
                "Priority support"
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm font-sans">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Link href="/pricing" className="w-full">
              <Button className="w-full font-sans">
                <Crown className="mr-2 h-4 w-4" />
                Start 7-Day Free Trial
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full font-sans"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
