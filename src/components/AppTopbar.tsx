"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDateLabel, todayKey } from "@/lib/date";

const headingByPath: Record<string, { eyebrow: string; title: string; showDate?: boolean }> = {
  "/": { eyebrow: "Balans", title: "Hoe voel ik mij vandaag?", showDate: true },
  "/check-in": { eyebrow: "Check-in", title: "Hoe is je basis vandaag?" },
  "/result": { eyebrow: "Resultaat", title: "Je analyse", showDate: true },
  "/week": { eyebrow: "Progressie", title: "Discipline door zichtbare progressie" },
  "/buddy": { eyebrow: "Balans Buddy", title: "Praat erover", showDate: true },
  "/settings": { eyebrow: "Instellingen", title: "Maak Balans van jou" },
};

export function AppTopbar() {
  const pathname = usePathname();
  const heading = headingByPath[pathname] ?? headingByPath["/"];
  const isSettingsActive = pathname === "/settings";

  return (
    <header className="app-topbar" aria-live="polite">
      <div className="min-w-0">
        <p className="mb-1.5 text-sm font-extrabold uppercase text-leaf">{heading.eyebrow}</p>
        <h1 className="text-4xl font-black leading-none">{heading.title}</h1>
        {heading.showDate ? (
          <p className="mt-3 text-base font-extrabold capitalize text-ink/60">
            {formatDateLabel(todayKey())}
          </p>
        ) : null}
      </div>

      <Link
        href="/settings"
        aria-label="Instellingen"
        aria-current={isSettingsActive ? "page" : undefined}
        className={`settings-floating-button ${
          isSettingsActive ? "border-leaf bg-leaf text-white" : "border-[#dde3ea] bg-white/90 text-leaf"
        }`}
      >
        <span aria-hidden="true">⚙</span>
      </Link>
    </header>
  );
}
