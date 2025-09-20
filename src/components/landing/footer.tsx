import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Twitch, Youtube } from "lucide-react";
import { Logo } from "./logo";

const footerLinks = [
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "FAQ", href: "#faq" },
  { name: "Testimonials", href: "#testimonials" },
  { name: "Privacy", href: "/legal/privacy" },
];

export const Footer = () => {
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
            <h3 className="font-semibold text-lg">Stay up to date</h3>
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 max-w-md">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button className="w-full sm:w-auto">Subscribe</Button>
            </div>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 SubTracker. All rights reserved.
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
