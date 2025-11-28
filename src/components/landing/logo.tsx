import Link from "next/link";
import Image from "next/image";

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src="/favicon.png"
        alt="SubWise"
        width={32}
        height={32}
        className="w-8 h-8"
        priority
      />
      <span className="font-bold text-xl tracking-tight">SubWise</span>
    </Link>
  );
};
