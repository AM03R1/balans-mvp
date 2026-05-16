import type { ReactNode } from "react";

type BalanceCardProps = {
  children: ReactNode;
  className?: string;
};

export function BalanceCard({ children, className = "" }: BalanceCardProps) {
  return (
    <section className={`rounded-lg border border-[#dde3ea] bg-cream p-5 shadow-soft ${className}`}>
      {children}
    </section>
  );
}
