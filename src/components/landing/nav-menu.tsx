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
      : "flex items-center gap-6", 
    className
  )}>
    <Link 
      href="#features" 
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Features
    </Link>
    <Link 
      href="#pricing" 
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Pricing
    </Link>
    <Link 
      href="#faq" 
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      FAQ
    </Link>
    <Link 
      href="#testimonials" 
      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
    >
      Testimonials
    </Link>
  </nav>
);
