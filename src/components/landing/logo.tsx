import Link from "next/link";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <span className="font-bold text-xl tracking-tight">SubWise</span>
    </Link>
  );
};
