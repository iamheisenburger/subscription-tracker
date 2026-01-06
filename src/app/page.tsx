"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/landing/footer";
import { Plus, Trash2, Search, TrendingUp, Settings, Home, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [searchQuery, setSearchQuery] = useState("");
  const isLimitReached = items.length >= FREE_LIMIT;

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

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

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

  const getCycleLabel = (cycle: string) => {
    return cycle === "monthly" ? "/month" : "/year";
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header - Clean white like mobile */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary-foreground stroke-[2.5px]" />
            </div>
            <span className="text-xl font-bold tracking-tight">SubWise</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/sign-in">
              <Button variant="ghost" size="sm" className="font-semibold text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="sm" className="font-semibold text-sm rounded-xl">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-24">
        {/* Search Bar - Mobile Style */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 bg-card rounded-xl px-4 py-3 border border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Totals Card - Dark like mobile app */}
        <div className="bg-primary rounded-[20px] p-6 mb-4 shadow-lg">
          <div className="flex">
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-primary-foreground/70 mb-2 tracking-wide">Monthly</p>
              <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(totals.monthly)}</p>
            </div>
            <div className="w-px bg-primary-foreground/20 mx-4" />
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold text-primary-foreground/70 mb-2 tracking-wide">Yearly</p>
              <p className="text-3xl font-bold text-primary-foreground">{formatCurrency(totals.annual)}</p>
            </div>
          </div>
        </div>

        {/* Add Subscription Form */}
        <div className="bg-card rounded-2xl p-4 mb-4 border border-border">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Subscription
                </Label>
                <Input
                  id="name"
                  placeholder="Netflix, Spotify..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl bg-muted border-0 h-12"
                />
              </div>
              <div>
                <Label htmlFor="amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="12.99"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl bg-muted border-0 h-12"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Billing
                </Label>
                <Select value={cadence} onValueChange={(value) => setCadence(value as Cadence)}>
                  <SelectTrigger className="rounded-xl bg-muted border-0 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annual">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleAdd}
              disabled={isLimitReached}
              className="w-full h-12 rounded-xl font-semibold text-base"
            >
              <Plus className="w-5 h-5 mr-2 stroke-[2.5px]" />
              {isLimitReached ? "Free limit reached" : "Add Subscription"}
            </Button>
          </div>
        </div>

        {/* Upgrade Banner */}
        {isLimitReached && (
          <div className="bg-card rounded-2xl p-4 mb-4 border border-warning/30">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Free limit reached</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Upgrade to Plus for unlimited subscriptions, analytics, and more.
                </p>
                <div className="flex gap-2">
                  <Link href="/pricing" className="flex-1">
                    <Button size="sm" className="w-full rounded-xl font-semibold">
                      See Plus Plans
                    </Button>
                  </Link>
                  <Link href="/sign-up" className="flex-1">
                    <Button size="sm" variant="outline" className="w-full rounded-xl font-semibold">
                      Create Account
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-border">
              <p className="font-semibold text-lg mb-1">
                {items.length === 0 ? "No subscriptions yet" : "No matches found"}
              </p>
              <p className="text-sm text-muted-foreground">
                {items.length === 0 
                  ? "Add your first subscription above"
                  : "Try adjusting your search"}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border shadow-sm"
                >
                  {/* Category dot placeholder */}
                  <div className="w-3 h-3 rounded-full bg-primary/60" />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{item.cadence}</p>
                  </div>

                  {/* Cost */}
                  <div className="text-right">
                    <p className="font-bold text-base">{formatCurrency(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{getCycleLabel(item.cadence)}</p>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-6 bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground">Data stored locally</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sign up to sync across devices, get renewal reminders, and unlock analytics.
          </p>
          <div className="flex gap-3">
            <Link href="/sign-up" className="flex-1">
              <Button className="w-full rounded-xl font-semibold">
                Save & Get Reminders
              </Button>
            </Link>
            <Link href="/pricing" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl font-semibold">
                See Plus Features
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Mobile App Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe">
        <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-3">
          <NavItem icon={Home} label="Home" active />
          <NavItem icon={TrendingUp} label="Analytics" href="/sign-up" />
          
          {/* Center FAB */}
          <Link href="/sign-up">
            <button className="w-14 h-14 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
              <Plus className="w-8 h-8 text-primary-foreground stroke-[2.5px]" />
            </button>
          </Link>
          
          <NavItem icon={Settings} label="Settings" href="/sign-up" />
          <NavItem icon={Crown} label="Plus" href="/pricing" badge />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function NavItem({ 
  icon: Icon, 
  label, 
  active, 
  href,
  badge 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  active?: boolean;
  href?: string;
  badge?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center gap-1 min-w-[60px]">
      <div className="relative">
        {badge && <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />}
        <Icon className={cn("w-6 h-6", active ? "text-foreground" : "text-muted-foreground")} />
      </div>
      <span className={cn(
        "text-[10px] font-medium",
        active ? "text-foreground font-bold" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
