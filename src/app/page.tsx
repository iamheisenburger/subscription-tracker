"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/landing/footer";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/landing/logo";
import { ThemeToggle } from "@/components/landing/theme-toggle";

type Cadence = "monthly" | "annual";

interface LocalSubscription {
  id: string;
  name: string;
  amount: number;
  cadence: Cadence;
}

const STORAGE_KEY = "subwise_local_subscriptions_v1";
const FREE_LIMIT = 3;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

export default function Home() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [items, setItems] = useState<LocalSubscription[]>([]);
  const isLimitReached = items.length >= FREE_LIMIT;

  // Load from local storage on first render
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalSubscription[];
        setItems(parsed);
      }
    } catch (error) {
      console.warn("Failed to load local subscriptions", error);
    }
  }, []);

  // Persist to local storage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn("Failed to save local subscriptions", error);
    }
  }, [items]);

  const totals = useMemo(() => {
    const monthly = items.reduce((sum, item) => {
      const monthlyValue = item.cadence === "monthly" ? item.amount : item.amount / 12;
      return sum + monthlyValue;
    }, 0);
    const annual = monthly * 12;
    return { monthly, annual };
  }, [items]);

  const handleAdd = () => {
    const parsedAmount = parseFloat(amount);
    if (!name.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    if (items.length >= FREE_LIMIT) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        amount: parsedAmount,
        cadence,
      },
    ]);
    setName("");
    setAmount("");
    setCadence("monthly");
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-20 border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-border/50 sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl h-full items-center justify-between px-6 gap-2">
          <div className="flex items-center gap-3 whitespace-nowrap">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Plus className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-black font-sans tracking-tighter text-primary">SubWise</h1>
            <div className="ml-2 hidden sm:block">
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-3 whitespace-nowrap">
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-bold font-sans text-sm px-4 hover:bg-primary/5 transition-colors">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-bold font-sans text-sm px-5 rounded-full shadow-lg transition-transform active:scale-95 bg-primary text-primary-foreground">
                Create account
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 space-y-10">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight font-sans text-foreground">
            Track your subscriptions instantly.
          </h2>
          <p className="text-lg text-muted-foreground font-medium font-sans max-w-2xl">
            Free includes up to {FREE_LIMIT} local subscriptions. Sign up to unlock sync, alerts, and detailed analytics.
          </p>
        </div>

        <Card className="border border-border/50 shadow-sm bg-card rounded-3xl overflow-hidden transition-all duration-300">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-8 pt-8">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold font-sans">Quick Tracker</CardTitle>
              <CardDescription className="font-medium font-sans">
                Add your subs below to see your spending.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="font-black uppercase tracking-widest text-[10px] px-3 py-1 bg-primary/10 text-primary border-none">
              No login required
            </Badge>
          </CardHeader>
          <CardContent className="space-y-8 px-8 pb-8">
            <div className="grid gap-6 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subscription name</Label>
                <Input
                  id="name"
                  placeholder="Netflix, Spotify, iCloud..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl border-border/50 bg-muted/20 h-12 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.99"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl border-border/50 bg-muted/20 h-12 focus-visible:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Billing</Label>
                <Select value={cadence} onValueChange={(value) => setCadence(value as Cadence)}>
                  <SelectTrigger className="rounded-xl border-border/50 bg-muted/20 h-12">
                    <SelectValue placeholder="Billing cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly" className="font-sans font-medium">Monthly</SelectItem>
                    <SelectItem value="annual" className="font-sans font-medium">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4 flex items-end">
                <Button
                  onClick={handleAdd}
                  className="w-full font-black font-sans h-14 text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] bg-primary text-primary-foreground"
                  disabled={isLimitReached}
                >
                  <Plus className="h-6 w-6 mr-2 stroke-[3px]" />
                  {isLimitReached ? "Free limit reached" : "Add subscription"}
                </Button>
              </div>
            </div>

            {isLimitReached && (
              <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-primary font-bold font-sans">
                  Free limit reached. Upgrade to Plus to go unlimited and unlock analytics, budgets, and exports.
                </div>
                <div className="flex gap-3">
                  <Link href="/pricing">
                    <Button size="sm" className="font-bold font-sans rounded-full">See Plus plans</Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button size="sm" variant="outline" className="font-bold font-sans rounded-full bg-background">Create account</Button>
                  </Link>
                </div>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
              <SummaryTile
                label="Monthly total"
                value={formatCurrency(totals.monthly)}
                helper="Converted to monthly"
              />
              <SummaryTile
                label="Annual total"
                value={formatCurrency(totals.annual)}
                helper="Projected yearly spend"
              />
              <SummaryTile
                label="Count"
                value={`${items.length}`}
                helper={items.length === 1 ? "1 subscription" : `${items.length} subscriptions`}
              />
            </div>

            <div className="border border-border/50 rounded-2xl overflow-hidden bg-muted/5">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground px-6 py-4">Name</TableHead>
                    <TableHead className="text-right font-bold uppercase tracking-wider text-[10px] text-muted-foreground px-6 py-4">Amount</TableHead>
                    <TableHead className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground px-6 py-4">Billing</TableHead>
                    <TableHead className="text-right font-bold uppercase tracking-wider text-[10px] text-muted-foreground px-6 py-4">Monthly equiv.</TableHead>
                    <TableHead className="w-12 px-6 py-4" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-12 font-sans font-medium italic">
                        Add your first subscription above to see totals.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => {
                    const monthly = item.cadence === "monthly" ? item.amount : item.amount / 12;
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/20 border-border/50 transition-colors">
                        <TableCell className="font-bold text-lg px-6 py-5">{item.name}</TableCell>
                        <TableCell className="text-right font-black px-6 py-5">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="capitalize font-bold text-muted-foreground px-6 py-5">{item.cadence}</TableCell>
                        <TableCell className="text-right font-black text-primary px-6 py-5">{formatCurrency(monthly)}</TableCell>
                        <TableCell className="text-right px-6 py-5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-10 w-10 transition-colors"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4 border-t border-border/50">
              <div className="text-sm text-muted-foreground space-y-1 font-medium font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Your data is stored locally on this device.
                </div>
                <div>
                  Sign up to back up, sync, and get email reminders.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/sign-up" className="flex-1 sm:flex-none">
                  <Button className="font-black font-sans w-full sm:w-auto h-12 px-8 rounded-full shadow-lg shadow-primary/20 bg-primary text-primary-foreground">
                    Save & get reminders
                  </Button>
                </Link>
                <Link href="/pricing" className="flex-1 sm:flex-none">
                  <Button variant="outline" className="font-black font-sans w-full sm:w-auto h-12 px-8 rounded-full border-border/50 hover:bg-muted/50 transition-colors">
                    See Plus features
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      <Footer />
    </div>
  );
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className={cn("p-6 rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all duration-300")}>
      <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">{label}</div>
      <div className="text-3xl font-black mt-2 tracking-tighter">{value}</div>
      {helper && (
        <div className="text-xs font-semibold text-muted-foreground mt-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          {helper}
        </div>
      )}
    </div>
  );
}
