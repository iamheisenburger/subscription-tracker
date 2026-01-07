"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FreeTierLimitModal } from "./free-tier-limit-modal";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/currency";

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

const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
  { code: "CAD", label: "Canadian Dollar (C$)", symbol: "C$" },
  { code: "AUD", label: "Australian Dollar (A$)", symbol: "A$" },
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
  const [currencySymbol, setCurrencySymbol] = useState<string>("$");
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

  useEffect(() => {
    const preferred = getPreferredCurrency();
    form.setValue("currency", preferred);
    const match = CURRENCY_OPTIONS.find((c) => c.code === preferred);
    setCurrencySymbol(match?.symbol || "$");
  }, [form]);

  const handleCurrencyChange = (code: string) => {
    form.setValue("currency", code);
    const match = CURRENCY_OPTIONS.find((c) => c.code === code);
    setCurrencySymbol(match?.symbol || "$");
    setPreferredCurrency(code);
  };

  const onSubmit = async (values: FormData) => {
    if (!user?.id) return;

    try {
      const safeDate = renewalDate instanceof Date && !isNaN(renewalDate.getTime())
        ? renewalDate
        : new Date();

      const nextBillingDate = includeRenewalDate 
        ? safeDate.getTime() 
        : Date.now();

      await createSubscription({
        clerkId: user.id,
        name: values.name,
        cost: values.cost,
        currency: values.currency.toUpperCase(),
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

  const adjustMonth = (increment: number) => {
    const newDate = new Date(renewalDate);
    newDate.setMonth(newDate.getMonth() + increment);
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
        {/* Mobile app style: backgroundColor: '#F8F9FA' for container */}
        <DialogContent className="sm:max-w-[450px] rounded-2xl p-0 gap-0 border border-border bg-[#F8F9FA] dark:bg-[#1A1F26] overflow-hidden [&>button]:hidden max-h-[90vh]">
          {/* Custom Header - Mobile app style: backgroundColor: '#FFFFFF' */}
          <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1A1F26] sticky top-0 z-10">
            <div className="w-10" /> {/* Spacer */}
            <DialogTitle className="text-xl font-bold text-[#1F2937] dark:text-[#F3F4F6]">Add Subscription</DialogTitle>
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
                {/* Cost Input - Mobile app style: costInputContainer */}
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormControl>
                        <div className="flex items-center bg-white dark:bg-[#0F1419] rounded-xl px-4 h-16 border border-[#E5E7EB] dark:border-[#374151]">
                          <span className="text-xl font-semibold text-[#1F2937] dark:text-[#F3F4F6] mr-2">{currencySymbol}</span>
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

                {/* Currency selection - Mobile-style segmented buttons */}
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">
                        Currency
                      </FormLabel>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {CURRENCY_OPTIONS.map((option) => (
                          <button
                            key={option.code}
                            type="button"
                            onClick={() => {
                              handleCurrencyChange(option.code);
                              field.onChange(option.code);
                            }}
                            className={cn(
                              "w-full text-left p-3 rounded-xl border-2 transition-all bg-white dark:bg-[#0F1419]",
                              field.value === option.code
                                ? "border-[#1F2937] dark:border-[#F3F4F6] text-[#1F2937] dark:text-[#F3F4F6] font-semibold"
                                : "border-[#E5E7EB] dark:border-[#374151] text-[#6C757D] hover:border-[#1F2937]/30 dark:hover:border-[#F3F4F6]/30"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{option.label}</span>
                              <span className="text-base font-bold">{option.symbol}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      <FormMessage className="text-xs font-medium px-1" />
                    </FormItem>
                  )}
                />

                {/* Subscription Name - Mobile app style: input */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Subscription Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="What service is this for?" 
                          className="h-14 rounded-xl bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#374151] focus-visible:border-[#1F2937] dark:focus-visible:border-[#F3F4F6] focus-visible:ring-0 text-base text-[#1F2937] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF] px-4" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs font-medium px-1" />
                    </FormItem>
                  )}
                />

                {/* Billing Cycle - Mobile app style: optionsGrid */}
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

                {/* Next Renewal Date Toggle - Mobile app style: renewalHeader */}
                <div className="space-y-3">
                  <div 
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#111821] border border-[#E5E7EB] dark:border-[#2A3038] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#1A1F26] transition-colors"
                    onClick={() => setIncludeRenewalDate(!includeRenewalDate)}
                  >
                    <div className="space-y-0.5">
                      <p className="text-base font-semibold text-[#1F2937] dark:text-[#F3F4F6]">Next Renewal Date</p>
                      <p className="text-[13px] text-[#6C757D]">Track when payment is due (optional)</p>
                    </div>
                    <Switch
                      checked={includeRenewalDate}
                      onCheckedChange={setIncludeRenewalDate}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Date Picker - Mobile app style: webDatePicker */}
                  {includeRenewalDate && (
                    <div className="bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#2A3038] rounded-xl p-4 animate-in fade-in slide-in-from-top-2 duration-200 space-y-3 shadow-sm dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
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
                            {renewalDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
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
                          <Calendar className="w-5 h-5 text-[#1F2937] dark:text-[#F3F4F6]" />
                          <span className="font-semibold text-base text-[#1F2937] dark:text-[#F3F4F6]">
                            {formatDate(renewalDate)}
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
                        Selected: {formatDate(renewalDate)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Category Selection - Mobile app style: categoryGrid */}
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

              {/* Notes (Optional) - matches mobile app */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="text-sm font-semibold text-[#1F2937] dark:text-[#F3F4F6]">
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this subscription..."
                        className="min-h-[88px] rounded-xl bg-white dark:bg-[#0F1419] border border-[#E5E7EB] dark:border-[#2A3038] focus-visible:border-[#1F2937] dark:focus-visible:border-[#F3F4F6] focus-visible:ring-0 text-base text-[#1F2937] dark:text-[#F3F4F6] placeholder:text-[#9CA3AF] px-4 py-3"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs font-medium px-1" />
                  </FormItem>
                )}
              />

                {/* Submit Button - Mobile app style: submitButton */}
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full rounded-[14px] h-[56px] font-bold text-[17px] bg-[#1F2937] dark:bg-[#F3F4F6] text-white dark:text-[#1F2937] hover:bg-[#1F2937]/90 dark:hover:bg-[#F3F4F6]/90 disabled:bg-[#D1D5DB] dark:disabled:bg-[#4B5563] disabled:text-white transition-colors"
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
