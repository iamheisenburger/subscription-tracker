"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Twitch, Youtube } from "lucide-react";
import { Logo } from "./logo";
import { useState } from "react";
import { toast } from "sonner";

const footerLinks = [
  { name: "Features", href: "/landing#features" },
  { name: "Pricing", href: "/landing#pricing" },
  { name: "FAQ", href: "/landing#faq" },
  { name: "Contact", href: "/contact" },
  { name: "Privacy", href: "/legal/privacy" },
  { name: "Terms", href: "/legal/terms" },
];

export const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast.success("Successfully subscribed!", {
          description: "You'll receive SubWise updates and insights.",
        });
        setEmail("");
      } else {
        throw new Error("Subscription failed");
      }
    } catch {
      toast.error("Failed to subscribe", {
        description: "Please try again or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="w-full border-t bg-background">
      <div className="max-w-screen-xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <Logo />
            <div className="mt-6 flex items-center space-x-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-7 lg:justify-self-end">
            <h3 className="font-semibold text-lg">Get SubWise updates</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              New features, tips, and subscription management insights
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row items-center gap-2 max-w-md">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 SubWise. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Twitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Youtube className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground">
              <Twitch className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
