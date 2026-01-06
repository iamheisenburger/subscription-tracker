import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";

export const Navbar = () => {
  return (
    <nav className="fixed z-50 top-6 inset-x-4 h-16 sm:h-20 bg-background/80 backdrop-blur-xl border border-border/50 max-w-screen-xl mx-auto rounded-3xl shadow-lg transition-all duration-300">
      <div className="h-full flex items-center justify-between mx-auto px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <ThemeToggle />
        </div>

        {/* Desktop Menu */}
        <NavMenu className="hidden lg:block" />

        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="hidden sm:inline-flex font-bold font-sans hover:bg-primary/5 rounded-full px-6">
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="hidden sm:inline-flex font-black font-sans rounded-full px-8 shadow-md transition-transform active:scale-95 bg-primary text-primary-foreground">
              Get Started
            </Button>
          </Link>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <NavigationSheet />
          </div>
        </div>
      </div>
    </nav>
  );
};
