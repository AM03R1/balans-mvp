import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppTopbar } from "@/components/AppTopbar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Balans MVP",
  description: "Dagelijkse balans check-ins voor slaap, stress, energie en voeding.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Balans",
  },
  icons: {
    icon: "/app-icon.svg",
    apple: "/app-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="nl">
      <body>
        <ServiceWorkerRegister />
        <main className="app-scroll-shell mx-auto flex w-full max-w-md flex-col px-4 pb-28">
          <AppTopbar />
          {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  );
}
