"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Vandaag", icon: "H" },
  { href: "/check-in", label: "Check-in", icon: "+" },
  { href: "/week", label: "Progressie", icon: "%" },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-[#dde3ea] bg-white/90 px-4 py-2 safe-bottom backdrop-blur">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[42px] flex-col items-center justify-center rounded-lg border text-xs font-extrabold transition ${
                isActive ? "border-leaf bg-leaf text-white" : "border-[#dde3ea] bg-white text-ink/60"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
