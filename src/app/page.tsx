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
import { CircleDollarSign, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="border-b bg-card/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <CircleDollarSign className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">SubWise</p>
              <p className="text-xs text-muted-foreground">Instant tracker · No login required</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-sans">Sign in</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-sans">Create account</Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-semibold">Track your subscriptions instantly</CardTitle>
              <CardDescription className="text-base">
                Free mode lets you add up to {FREE_LIMIT} subscriptions locally. Sign in to back up, sync, and go unlimited.
              </CardDescription>
            </div>
            <Badge variant="outline" className="font-sans">No login required</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Subscription name</Label>
                <Input
                  id="name"
                  placeholder="Netflix, Spotify, iCloud..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.99"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Billing</Label>
                <Select value={cadence} onValueChange={(value) => setCadence(value as Cadence)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Billing cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 flex items-end">
                <Button
                  onClick={handleAdd}
                  className="w-full font-sans"
                  disabled={items.length >= FREE_LIMIT}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {items.length >= FREE_LIMIT ? "Free limit reached" : "Add subscription"}
                </Button>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-3">
              <SummaryTile
                label="Monthly total"
                value={formatCurrency(totals.monthly)}
                helper="All subscriptions converted to monthly"
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

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Monthly equiv.</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Add your first subscription to see totals.
                      </TableCell>
                    </TableRow>
                  )}
                  {items.map((item) => {
                    const monthly = item.cadence === "monthly" ? item.amount : item.amount / 12;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        <TableCell className="capitalize">{item.cadence}</TableCell>
                        <TableCell className="text-right">{formatCurrency(monthly)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.id)}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground space-y-1">
                <div>Your data is stored locally on this device.</div>
                <div>Free includes up to {FREE_LIMIT} subscriptions. Sign up to back up, sync, and go unlimited with Plus.</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/sign-up">
                  <Button className="font-sans">Save & sync my data</Button>
                </Link>
                <Link href="/dashboard/upgrade">
                  <Button variant="outline" className="font-sans">See Plus features</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Need the full marketing page?</span>
          <Link href="/landing" className="text-primary hover:underline">View product overview</Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/pricing" className="text-primary hover:underline">Pricing</Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/legal/privacy" className="text-primary hover:underline">Privacy</Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/legal/terms" className="text-primary hover:underline">Terms</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function SummaryTile({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className={cn("p-4 rounded-lg border bg-card/50")}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {helper && <div className="text-xs text-muted-foreground mt-1">{helper}</div>}
    </div>
  );
}
