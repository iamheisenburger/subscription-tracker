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
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      // Calculate next billing date based on renewal date or today
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

  const adjustMonth = (increment: number) => {
    const newDate = new Date(renewalDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setRenewalDate(newDate);
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
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Subscription</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Track a new recurring expense.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Subscription Name
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Netflix, Spotify, etc." 
                        className="rounded-xl bg-muted border-0 h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cost & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Cost
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="9.99"
                          className="rounded-xl bg-muted border-0 h-12"
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Currency
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-muted border-0 h-12">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                          <SelectItem value="CAD">CAD (C$)</SelectItem>
                          <SelectItem value="AUD">AUD (A$)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Billing Cycle */}
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Billing Cycle
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      {["weekly", "monthly", "yearly"].map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => field.onChange(cycle)}
                          className={cn(
                            "py-3 px-2 rounded-xl text-sm font-semibold transition-colors border-2",
                            field.value === cycle
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-transparent hover:border-border"
                          )}
                        >
                          {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Renewal Date Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl">
                <div>
                  <p className="text-sm font-medium">Next Renewal Date</p>
                  <p className="text-xs text-muted-foreground">Track when payment is due</p>
                </div>
                <Switch
                  checked={includeRenewalDate}
                  onCheckedChange={setIncludeRenewalDate}
                />
              </div>

              {/* Date Picker */}
              {includeRenewalDate && (
                <div className="bg-muted rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => adjustMonth(-1)}
                      className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-semibold">
                      {renewalDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustMonth(1)}
                      className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => adjustDay(-1)}
                      className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-4xl font-bold">{renewalDate.getDate()}</span>
                    <button
                      type="button"
                      onClick={() => adjustDay(1)}
                      className="w-10 h-10 rounded-full bg-card flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    Selected: {formatDate(renewalDate)}
                  </p>
                </div>
              )}

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl bg-muted border-0 h-12">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: cat.color }}
                              />
                              {cat.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Additional notes..." 
                        className="rounded-xl bg-muted border-0 h-12" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl h-12 font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 rounded-xl h-12 font-semibold"
                >
                  Add Subscription
                </Button>
              </div>
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
