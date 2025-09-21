"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { FreeTierLimitModal } from "./free-tier-limit-modal";

const formSchema = z.object({
  name: z.string().min(1, "Subscription name is required"),
  cost: z.number().min(0.01, "Cost must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  billingCycle: z.enum(["monthly", "yearly", "weekly"]),
  nextBillingDate: z.date(),
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
  const { user } = useUser();
  const createSubscription = useMutation(api.subscriptions.createSubscription);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cost: undefined,
      currency: "USD",
      billingCycle: "monthly",
      category: "",
      description: "",
    },
  });

  const onSubmit = async (values: FormData) => {
    if (!user?.id) return;

    try {
      await createSubscription({
        clerkId: user.id,
        name: values.name,
        cost: values.cost,
        currency: values.currency,
        billingCycle: values.billingCycle,
        nextBillingDate: values.nextBillingDate.getTime(),
        category: values.category,
        description: values.description,
      });

      toast.success("Subscription added successfully!");
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating subscription:", error);
      
      // Check if it's a free tier limit error
      if (error instanceof Error && error.message.includes("Free plan allows maximum 3 subscriptions")) {
        setOpen(false);
        setLimitModalOpen(true);
      } else {
        toast.error("Failed to add subscription. Please try again.");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-sans">Add New Subscription</DialogTitle>
          <DialogDescription className="font-sans">
            Add a new subscription to track your recurring expenses.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Subscription Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Netflix, Spotify, etc." className="font-sans" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-sans">Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="9.99"
                        className="font-sans"
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
                    <FormLabel className="font-sans">Currency</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="font-sans">
                          <SelectValue placeholder="Select currency" />
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

            <FormField
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Billing Cycle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-sans">
                        <SelectValue placeholder="Select billing cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextBillingDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-sans">Next Billing Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-sans",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

{/* Category field - Premium feature only - Hidden for now */}
            {/* TODO: Show only for premium users
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Category (Premium Feature)</FormLabel>
                  <FormControl>
                    <Input placeholder="Entertainment, Productivity, etc." className="font-sans" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            */}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-sans">Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes..." className="font-sans" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="font-sans"
              >
                Cancel
              </Button>
              <Button type="submit" className="font-sans">
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
      currentCount={3}
      limit={3}
    />
  </>
  );
}
