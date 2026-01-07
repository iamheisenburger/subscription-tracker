"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
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
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Doc, Id } from "../../../convex/_generated/dataModel";
import { useUserTier } from "@/hooks/use-user-tier";

// Mobile app category colors - matching exactly
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
  billingCycle: z.enum(["daily", "monthly", "yearly", "weekly"]),
  nextBillingDate: z.date(),
  category: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface EditSubscriptionDialogProps {
  subscription: Doc<"subscriptions">;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditSubscriptionDialog({ subscription, children, open: openProp, onOpenChange }: EditSubscriptionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof openProp === "boolean" && typeof onOpenChange === "function";
  const open = isControlled ? (openProp as boolean) : internalOpen;
  const setOpen = isControlled ? (onOpenChange as (open: boolean) => void) : setInternalOpen;
  const { user } = useUser();
  const updateSubscription = useMutation(api.subscriptions.updateSubscription);
  // Note: Premium tier check available via useUserTier() if needed for future features
  useUserTier();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subscription.name,
      cost: subscription.cost,
      currency: subscription.currency,
      billingCycle: subscription.billingCycle,
      nextBillingDate: new Date(subscription.nextBillingDate),
      category: subscription.category || "",
      description: subscription.description || "",
    },
  });

  const adjustDay = (increment: number) => {
    const currentDate = form.getValues("nextBillingDate");
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + increment);
    form.setValue("nextBillingDate", newDate);
  };

  const adjustMonth = (increment: number) => {
    const currentDate = form.getValues("nextBillingDate");
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    form.setValue("nextBillingDate", newDate);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const onSubmit = async (values: FormData) => {
    if (!user?.id) return;

    try {
      await updateSubscription({
        subscriptionId: subscription._id as Id<"subscriptions">,
        clerkId: user.id,
        name: values.name,
        cost: values.cost,
        currency: values.currency,
        billingCycle: values.billingCycle,
        nextBillingDate: values.nextBillingDate.getTime(),
        category: values.category,
        description: values.description,
      });

      toast.success("Subscription updated successfully!");
      setOpen(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Failed to update subscription. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      {/* Mobile app style dialog */}
      <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 gap-0 border border-border bg-[#F8F9FA] dark:bg-[#1A1F26] overflow-hidden [&>button]:hidden max-h-[90vh]">
        {/* Custom Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1F26] sticky top-0 z-10">
          <div className="w-10" />
          <DialogTitle className="text-xl font-bold text-[#1F2937] dark:text-[#F3F4F6]">Edit Subscription</DialogTitle>
          <button 
            onClick={() => setOpen(false)}
            className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-colors"
          >
            <X className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto bg-[#F8F9FA] dark:bg-[#1A1F26]" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pb-4">
              {/* Cost Input */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormControl>
                      <div className="flex items-center bg-white dark:bg-[#0F1419] rounded-xl px-4 h-16 border border-[#E5E7EB] dark:border-[#374151]">
                        <span className="text-xl font-semibold text-[#1F2937] dark:text-[#F3F4F6] mr-1">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          className="border-0 bg-transparent text-2xl font-bold h-full p-0 focus-visible:ring-0 text-[#1F2937] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF]"
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
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Subscription Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Subscription Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Netflix, Spotify, etc." 
                        className="h-14 rounded-xl bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#374151] focus-visible:border-[#1F2937] dark:focus-visible:border-[#F3F4F6] focus-visible:ring-0 text-base text-[#1F2937] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF] px-4" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Billing Cycle */}
              <FormField
                control={form.control}
                name="billingCycle"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Billing Cycle</FormLabel>
                    <div className="grid grid-cols-2 gap-2.5">
                      {["daily", "weekly", "monthly", "yearly"].map((cycle) => (
                        <button
                          key={cycle}
                          type="button"
                          onClick={() => field.onChange(cycle)}
                          className={cn(
                            "py-4 px-4 rounded-xl text-[15px] font-semibold transition-all border-2",
                            field.value === cycle
                              ? "bg-[#1F2937] dark:bg-[#F3F4F6] text-white dark:text-[#1F2937] border-[#1F2937] dark:border-[#F3F4F6]"
                              : "bg-white dark:bg-[#0F1419] text-[#6C757D] border-[#E5E7EB] dark:border-[#374151] hover:border-[#1F2937]/30 dark:hover:border-[#F3F4F6]/30"
                          )}
                        >
                          {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                        </button>
                      ))}
                    </div>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Next Billing Date - month + day controls to match mobile app */}
              <FormField
                control={form.control}
                name="nextBillingDate"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Next Renewal Date</FormLabel>
                    <div className="bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#2A3038] rounded-xl p-4 space-y-3 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => adjustMonth(-1)}
                          className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#2D3641] flex items-center justify-center transition-colors border border-[#E5E7EB] dark:border-[#2A3038]"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                        </button>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm text-[#6C757D] dark:text-[#9CA3AF]">Month</span>
                          <span className="font-semibold text-base text-[#1F2937] dark:text-[#F3F4F6]">
                            {field.value.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustMonth(1)}
                          className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#2D3641] flex items-center justify-center transition-colors border border-[#E5E7EB] dark:border-[#2A3038]"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => adjustDay(-1)}
                          className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#2D3641] flex items-center justify-center transition-colors border border-[#E5E7EB] dark:border-[#2A3038]"
                          aria-label="Previous day"
                        >
                          <ChevronLeft className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                        </button>
                        <div className="flex items-center gap-3">
                          <CalendarIcon className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                          <span className="font-semibold text-base text-[#1F2937] dark:text-[#F3F4F6]">
                            {formatDate(field.value)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => adjustDay(1)}
                          className="w-10 h-10 rounded-full bg-[#F3F4F6] dark:bg-[#1F2937] hover:bg-[#E5E7EB] dark:hover:bg-[#2D3641] flex items-center justify-center transition-colors border border-[#E5E7EB] dark:border-[#2A3038]"
                          aria-label="Next day"
                        >
                          <ChevronRight className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                        </button>
                      </div>

                      <p className="text-center text-sm text-[#6C757D] dark:text-[#9CA3AF]">
                        Selected: {formatDate(field.value)}
                      </p>
                    </div>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Category Selection - Available for all users (mobile app shows it for all) */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Category</FormLabel>
                    <div className="grid grid-cols-1 gap-2.5">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => field.onChange(cat.value)}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                            field.value === cat.value
                              ? "bg-[#F9FAFB] dark:bg-[#1A1F26]"
                              : "bg-white dark:bg-[#0F1419] border-[#E5E7EB] dark:border-[#374151] hover:border-[#9CA3AF] dark:hover:border-[#4B5563]"
                          )}
                          style={{
                            borderColor: field.value === cat.value ? cat.color : undefined
                          }}
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className={cn(
                            "font-medium text-base",
                            field.value === cat.value 
                              ? "text-[#1F2937] dark:text-[#F3F4F6] font-semibold" 
                              : "text-[#6C757D]"
                          )}>
                            {cat.label}
                          </span>
                        </button>
                      ))}
                    </div>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any notes about this subscription..." 
                        className="min-h-[80px] rounded-xl bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#374151] focus-visible:border-[#1F2937] dark:focus-visible:border-[#F3F4F6] focus-visible:ring-0 text-base text-[#1F2937] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF] px-4 py-3" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full rounded-[14px] h-[56px] font-bold text-[17px] bg-[#1F2937] dark:bg-[#F3F4F6] text-white dark:text-[#1F2937] hover:bg-[#1F2937]/90 dark:hover:bg-[#F3F4F6]/90 transition-colors"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
