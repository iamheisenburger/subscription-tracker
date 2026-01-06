import Link from "next/link";
import { Plus } from "lucide-react";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
        <Plus className="w-5 h-5 text-primary-foreground stroke-[3px]" />
      </div>
      <span className="font-black text-2xl tracking-tighter text-primary">SubWise</span>
    </Link>
  );
};
