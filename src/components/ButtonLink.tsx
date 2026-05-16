import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const styles =
    variant === "primary"
      ? "bg-leaf text-white shadow-soft"
      : "bg-white text-ink ring-1 ring-[#dde3ea]";

  return (
    <Link
      href={href}
      className={`flex min-h-[42px] items-center justify-center rounded-lg px-5 text-center text-base font-extrabold ${styles}`}
    >
      {children}
    </Link>
  );
}
