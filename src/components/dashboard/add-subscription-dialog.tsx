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
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
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
  billingCycle: z.enum(["daily", "weekly", "monthly", "yearly"]),
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
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 gap-0 border-0 bg-white overflow-hidden [&>button]:hidden">
          {/* Custom Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-white sticky top-0 z-10">
            <div className="w-10" /> {/* Spacer */}
            <DialogTitle className="text-xl font-black text-[#1F2937]">Add Subscription</DialogTitle>
            <button 
              onClick={() => setOpen(false)}
              className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="p-6 max-h-[80vh] overflow-y-auto bg-white custom-scrollbar">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-4">
                {/* Cost Input - Prominent at top */}
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <div className="flex items-center bg-muted/40 rounded-2xl px-5 h-20 border-2 border-transparent focus-within:border-[#1F2937]/20 transition-all shadow-inner">
                          <span className="text-3xl font-black text-[#1F2937] mr-3 opacity-40">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className="border-0 bg-transparent text-4xl font-black h-full p-0 focus-visible:ring-0 text-[#1F2937] placeholder:text-muted-foreground/30"
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
                      <FormMessage className="text-xs font-bold px-1" />
                    </FormItem>
                  )}
                />

                {/* Subscription Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Subscription Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What service is this for?" 
                          className="h-14 rounded-2xl bg-muted/40 border-2 border-transparent focus-visible:border-[#1F2937]/20 focus-visible:ring-0 text-base font-bold px-5" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-bold px-1" />
                    </FormItem>
                  )}
                />

                {/* Billing Cycle - 4 prominent buttons */}
                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Billing Cycle</FormLabel>
                      <div className="grid grid-cols-2 gap-3">
                        {["daily", "weekly", "monthly", "yearly"].map((cycle) => (
                          <button
                            key={cycle}
                            type="button"
                            onClick={() => field.onChange(cycle)}
                            className={cn(
                              "py-4 px-4 rounded-2xl text-sm font-black transition-all border-2",
                              field.value === cycle
                                ? "bg-[#1F2937] text-white border-[#1F2937] shadow-lg scale-[1.02]"
                                : "bg-white text-muted-foreground border-border/50 hover:border-[#1F2937]/30"
                            )}
                          >
                            {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                          </button>
                        ))}
                      </div>
                      <FormMessage className="text-xs font-bold px-1" />
                    </FormItem>
                  )}
                />

                {/* Next Renewal Date Toggle - Improved clickability */}
                <div className="space-y-4">
                  <div 
                    className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border/10 cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => setIncludeRenewalDate(!includeRenewalDate)}
                  >
                    <div className="space-y-1">
                      <p className="text-base font-black text-[#1F2937]">Next Renewal Date</p>
                      <p className="text-sm font-bold text-muted-foreground">Track when payment is due (optional)</p>
                    </div>
                    <Switch
                      checked={includeRenewalDate}
                      onCheckedChange={setIncludeRenewalDate}
                      className="data-[state=checked]:bg-[#1F2937]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {includeRenewalDate && (
                    <div className="bg-muted/40 border border-[#1F2937]/10 rounded-2xl p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border border-border/50 shadow-sm">
                          <Calendar className="w-6 h-6 text-[#1F2937]" />
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => adjustDay(-1)}
                            className="w-11 h-11 rounded-full bg-white border border-border/50 hover:bg-muted flex items-center justify-center transition-all active:scale-90"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <span className="font-black text-lg text-[#1F2937]">{formatDate(renewalDate)}</span>
                          <button
                            type="button"
                            onClick={() => adjustDay(1)}
                            className="w-11 h-11 rounded-full bg-white border border-border/50 hover:bg-muted flex items-center justify-center transition-all active:scale-90"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Selection - Matching mobile app list style */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Category</FormLabel>
                      <div className="grid grid-cols-1 gap-2">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat.value}
                            type="button"
                            onClick={() => field.onChange(cat.value)}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                              field.value === cat.value
                                ? "bg-white shadow-md border-current scale-[1.01]"
                                : "bg-white border-border/40 hover:border-border"
                            )}
                            style={{
                              borderColor: field.value === cat.value ? cat.color : undefined
                            }}
                          >
                            <div 
                              className="w-5 h-5 rounded-full shadow-sm group-active:scale-90 transition-transform" 
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className={cn(
                              "font-black text-base",
                              field.value === cat.value ? "text-[#1F2937]" : "text-muted-foreground"
                            )}>
                              {cat.label}
                            </span>
                          </button>
                        ))}
                      </div>
                      <FormMessage className="text-xs font-bold px-1" />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="sticky bottom-0 pt-6 pb-2 bg-white/80 backdrop-blur-md border-t border-border mt-auto">
                  <Button 
                    type="submit" 
                    className="w-full rounded-2xl h-16 font-black text-lg bg-[#1F2937] text-white hover:bg-[#1F2937]/90 active:scale-[0.98] transition-all shadow-xl"
                    disabled={!form.watch("cost") || !form.watch("name") || form.watch("cost") <= 0}
                  >
                    Add Subscription
                  </Button>
                </div>
              </form>
            </Form>
          </div>
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
