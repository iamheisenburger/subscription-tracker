import Link from "next/link";
import { CreditCard } from "lucide-react";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
        <CreditCard className="w-4 h-4 text-primary-foreground" />
      </div>
      <span className="font-bold text-lg">SubWise</span>
    </Link>
  );
};
