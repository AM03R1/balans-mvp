"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SettingsButton() {
  const pathname = usePathname();
  const isActive = pathname === "/settings";

  return (
    <div className="settings-fixed-layer">
      <Link
        href="/settings"
        aria-label="Instellingen"
        aria-current={isActive ? "page" : undefined}
        className={`settings-floating-button ${
          isActive ? "border-leaf bg-leaf text-white" : "border-[#dde3ea] bg-white/90 text-leaf"
        }`}
      >
        <span aria-hidden="true">⚙</span>
      </Link>
    </div>
  );
}
