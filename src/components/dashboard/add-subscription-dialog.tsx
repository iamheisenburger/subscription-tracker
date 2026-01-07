"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useUserTier } from "@/hooks/use-user-tier";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FreeTierLimitModal } from "./free-tier-limit-modal";

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

const formSchema = z.object({
  name: z.string().min(1, "Subscription name is required"),
  cost: z.number().min(0.01, "Cost must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  billingCycle: z.enum(["weekly", "monthly", "yearly"]),
  category: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddSubscriptionDialogProps {
  children: React.ReactNode;
}

export function AddSubscriptionDialog({ children }: AddSubscriptionDialogProps) {
  const [open, setOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [includeRenewalDate, setIncludeRenewalDate] = useState(false);
  const [renewalDate, setRenewalDate] = useState<Date>(new Date());
  const { user } = useUser();
  const { isPremium, subscriptionLimit } = useUserTier();
  const createSubscription = useMutation(api.subscriptions.createSubscription);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cost: undefined,
      currency: "USD",
      billingCycle: "monthly",
      category: "streaming",
      description: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user?.id) return;

    try {
      const nextBillingDate = includeRenewalDate 
        ? renewalDate.getTime() 
        : new Date().getTime();

      await createSubscription({
        clerkId: user.id,
        name: values.name,
        cost: values.cost,
        currency: values.currency,
        billingCycle: values.billingCycle,
        nextBillingDate,
        category: values.category,
        description: values.description,
      });

      toast.success("Subscription added successfully!");
      form.reset();
      setIncludeRenewalDate(false);
      setRenewalDate(new Date());
      setOpen(false);
    } catch (error) {
      console.error("Error creating subscription:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isLimitError = errorMessage.includes("Free plan") || 
                          errorMessage.includes("maximum 3") || 
                          errorMessage.includes("Upgrade to Plus") ||
                          (!isPremium && subscriptionLimit === 3);
      
      if (isLimitError) {
        setOpen(false);
        setTimeout(() => setLimitModalOpen(true), 100);
      } else {
        toast.error("Failed to add subscription. Please try again.");
      }
    }
  };

  const adjustDay = (increment: number) => {
    const newDate = new Date(renewalDate);
    newDate.setDate(newDate.getDate() + increment);
    setRenewalDate(newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">Add Subscription</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Cost - Mobile app style (cost first) */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex items-center bg-muted rounded-xl px-4 h-14">
                        <span className="text-xl font-semibold text-muted-foreground mr-2">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="border-0 bg-transparent text-xl font-semibold h-full p-0 focus-visible:ring-0"
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "") {
                              field.onChange(undefined);
                            } else {
                              const numValue = parseFloat(value);
                              if (!isNaN(numValue)) {
                                field.onChange(numValue);
                              }
                            }
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Billing Cycle - 4 buttons like mobile app */}
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Billing Cycle</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {["daily", "weekly", "monthly", "yearly"].map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => {
                            // Only allow weekly, monthly, yearly in the actual form value
                            if (cycle !== "daily") {
                              field.onChange(cycle);
                            }
                          }}
                          className={cn(
                            "py-4 px-4 rounded-xl text-sm font-semibold transition-colors border-2",
                            field.value === cycle
                              ? "bg-primary text-primary-foreground border-primary"
                              : cycle === "daily"
                              ? "bg-muted/50 text-muted-foreground/50 border-transparent cursor-not-allowed"
                              : "bg-card text-muted-foreground border-border hover:border-primary/50"
                          )}
                          disabled={cycle === "daily"}
                        >
                          {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Next Renewal Date Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">Next Renewal Date</p>
                    <p className="text-sm text-muted-foreground">Track when payment is due (optional)</p>
                  </div>
                  <Switch
                    checked={includeRenewalDate}
                    onCheckedChange={setIncludeRenewalDate}
                  />
                </div>

                {/* Date Picker - Shows when toggle is ON */}
                {includeRenewalDate && (
                  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => adjustDay(-1)}
                          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold">{formatDate(renewalDate)}</span>
                        <button
                          type="button"
                          onClick={() => adjustDay(1)}
                          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Category - List of buttons like mobile app */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Category</FormLabel>
                    <div className="space-y-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => field.onChange(cat.value)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left",
                            field.value === cat.value
                              ? "border-current bg-card"
                              : "border-border bg-card hover:border-border/80"
                          )}
                          style={{
                            borderColor: field.value === cat.value ? cat.color : undefined
                          }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className={cn(
                            "font-medium",
                            field.value === cat.value ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button - Full width at bottom */}
              <Button 
                type="submit" 
                className="w-full rounded-xl h-14 font-semibold text-base"
                disabled={!form.watch("cost") || form.watch("cost") <= 0}
              >
                Add Subscription
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <FreeTierLimitModal 
        open={limitModalOpen}
        onOpenChange={setLimitModalOpen}
        currentCount={subscriptionLimit}
        limit={subscriptionLimit}
      />
    </>
  );
}
