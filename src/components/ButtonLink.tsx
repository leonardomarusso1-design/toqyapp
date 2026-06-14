import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className }: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 shadow-soft",
        variant === "primary"
          ? "bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white shadow-glow hover:from-primary-400 hover:via-primary-500 hover:to-accent-400 hover:scale-[1.02]"
          : variant === "accent"
          ? "bg-gradient-to-r from-accent-500 to-primary-500 text-white shadow-glow hover:from-accent-400 hover:to-primary-400 hover:scale-[1.02]"
          : "border border-white/15 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]",
        className,
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
