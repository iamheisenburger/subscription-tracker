import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavMenuProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export const NavMenu = ({ className, orientation = "horizontal" }: NavMenuProps) => (
  <nav className={cn(
    orientation === "vertical" 
      ? "flex flex-col items-start gap-4" 
      : "flex items-center space-x-8", 
    className
  )}>
    <Link 
      href="/landing#features" 
      className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
    >
      Features
    </Link>
    <Link 
      href="/landing#pricing" 
      className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
    >
      Pricing
    </Link>
    <Link 
      href="/landing#faq" 
      className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
    >
      FAQ
    </Link>
    <Link 
      href="/landing#testimonials" 
      className="text-sm font-medium text-foreground hover:text-primary transition-colors px-2 py-1"
    >
      Testimonials
    </Link>
  </nav>
);
