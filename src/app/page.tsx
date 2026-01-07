"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Footer } from "@/components/landing/footer";
import { Plus, Trash2, Search, TrendingUp, Settings, Home as HomeIcon, Crown, Sparkles, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/landing/theme-toggle";

type Cadence = "monthly" | "yearly" | "weekly" | "daily";
type Category = "streaming" | "music" | "productivity" | "fitness" | "gaming" | "news" | "cloud" | "other";

const CATEGORIES: Record<Category, { label: string; color: string }> = {
  streaming: { label: 'Streaming', color: '#E63946' },
  music: { label: 'Music', color: '#F77F00' },
  productivity: { label: 'Productivity', color: '#06A77D' },
  fitness: { label: 'Fitness', color: '#2A9D8F' },
  gaming: { label: 'Gaming', color: '#7209B7' },
  news: { label: 'News', color: '#457B9D' },
  cloud: { label: 'Cloud Storage', color: '#3A86FF' },
  other: { label: 'Other', color: '#6C757D' },
};

interface LocalSubscription {
  id: string;
  name: string;
  amount: number;
  cadence: Cadence;
  category: Category;
  renewalDate?: string;
}

const STORAGE_KEY = "subwise_local_subscriptions_v2";
const FREE_LIMIT = 3;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function HomePage() {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [cadence, setCadence] = useState<Cadence>("monthly");
  const [category, setCategory] = useState<Category>("streaming");
  const [includeRenewalDate, setIncludeRenewalDate] = useState(false);
  const [renewalDate, setRenewalDate] = useState<Date>(new Date());
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
      let monthlyValue = item.amount;
      switch (item.cadence) {
        case 'daily': monthlyValue = item.amount * 30; break;
        case 'weekly': monthlyValue = item.amount * 4.33; break;
        case 'yearly': monthlyValue = item.amount / 12; break;
      }
      return sum + monthlyValue;
    }, 0);
    const annual = monthly * 12;
    return { monthly, annual };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      CATEGORIES[item.category].label.toLowerCase().includes(searchQuery.toLowerCase())
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
        category,
        renewalDate: includeRenewalDate ? renewalDate.toISOString() : undefined,
      },
    ]);
    setName("");
    setAmount("");
    setCadence("monthly");
    setCategory("streaming");
    setIncludeRenewalDate(false);
    setRenewalDate(new Date());
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const getCycleLabel = (cycle: string) => {
    const labels: Record<string, string> = {
      daily: '/day',
      weekly: '/week',
      monthly: '/month',
      yearly: '/year',
    };
    return labels[cycle] || '';
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

  const getDaysUntilRenewal = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const renewal = new Date(dateStr);
    const now = new Date();
    renewal.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = renewal.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
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

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-4 pb-24 md:pb-8">
        {/* Hero section for desktop */}
        <div className="hidden md:block text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">Track Your Subscriptions</h1>
          <p className="text-muted-foreground">Try it free — no sign up required for up to 3 subscriptions</p>
        </div>

        {/* Search Bar */}
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

        {/* Totals Card */}
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

        {/* Two column layout on larger screens */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Add Subscription Form */}
          <div className="bg-card rounded-2xl p-4 border border-border h-fit">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Subscription
                </Label>
                <Input
                  placeholder="Netflix, Spotify..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl bg-muted border-0 h-12"
                />
              </div>

              {/* Cost & Billing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                    Amount
                  </Label>
                  <Input
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
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                  Category
                </Label>
                <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                  <SelectTrigger className="rounded-xl bg-muted border-0 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORIES) as Category[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: CATEGORIES[cat].color }}
                          />
                          {CATEGORIES[cat].label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                    Selected: {formatDate(renewalDate)}, {renewalDate.getFullYear()}
                  </p>
                </div>
              )}

              <Button
                onClick={handleAdd}
                disabled={isLimitReached}
                className="w-full h-12 rounded-xl font-semibold text-base"
              >
                <Plus className="w-5 h-5 mr-2 stroke-[2.5px]" />
                {isLimitReached ? "Free limit reached" : "Add Subscription"}
              </Button>
            </div>

            {/* Upgrade Banner */}
            {isLimitReached && (
              <div className="mt-4 p-3 rounded-xl border border-warning/30 bg-warning/5">
                <div className="flex items-start gap-3">
                  <Crown className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1">Free limit reached</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Upgrade to Plus for unlimited subscriptions, analytics, and more.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/pricing">
                        <Button size="sm" className="rounded-xl font-semibold text-xs">
                          See Plus Plans
                        </Button>
                      </Link>
                      <Link href="/sign-up">
                        <Button size="sm" variant="outline" className="rounded-xl font-semibold text-xs">
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subscription List */}
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="bg-card rounded-2xl p-8 text-center border border-border">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-lg mb-1">
                  {items.length === 0 ? "No subscriptions yet" : "No matches found"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {items.length === 0 
                    ? "Add your first subscription to get started"
                    : "Try adjusting your search"}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const daysUntil = getDaysUntilRenewal(item.renewalDate);
                const isUpcoming = daysUntil !== null && daysUntil <= 3 && daysUntil >= 0;
                return (
                  <div
                    key={item.id}
                    className="bg-card rounded-2xl p-4 flex items-center gap-3 border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Category dot */}
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: CATEGORIES[item.category].color }}
                    />
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{CATEGORIES[item.category].label}</p>
                    </div>

                    {/* Renewal badge */}
                    {item.renewalDate && daysUntil !== null && (
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                          isUpcoming ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                        )}>
                          <Calendar className="w-3 h-3" />
                          {formatDate(new Date(item.renewalDate))}
                        </div>
                        <span className={cn(
                          "text-[10px] mt-0.5",
                          isUpcoming ? "text-destructive font-medium" : "text-muted-foreground"
                        )}>
                          {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                        </span>
                      </div>
                    )}

                    {/* Cost */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-base">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-muted-foreground">{getCycleLabel(item.cadence)}</p>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
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

      {/* Bottom Navigation - Mobile Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe md:hidden">
        <div className="max-w-lg mx-auto flex items-center justify-between px-6 py-3">
          <NavItem icon={HomeIcon} label="Home" active />
          <NavItem icon={TrendingUp} label="Analytics" href="/sign-up" />
          
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
