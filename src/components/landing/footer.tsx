import Link from "next/link";
import { CreditCard } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="w-full border-t bg-background">
      <div className="max-w-screen-xl mx-auto px-6 py-8">
        {/* Single row layout - much more minimal */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo and Copyright */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="font-bold text-base font-sans">SubTracker</span>
            <span className="text-sm text-muted-foreground font-sans">© 2025</span>
          </div>

          {/* Essential Links Only */}
          <div className="flex items-center gap-6 text-sm font-sans">
            <Link 
              href="/legal/privacy" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link 
              href="/legal/terms" 
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <Link 
              href="/sign-up" 
              className="font-medium text-primary hover:underline"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
