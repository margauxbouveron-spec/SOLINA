import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { ContourLines } from "@/components/bg/ContourLines";
import { SunriseIntro } from "@/components/intro/SunriseIntro";
import { Nav } from "@/components/nav/Nav";
import { PhaseRouter } from "@/components/sun/PhaseRouter";
import { SunCanvas } from "@/components/sun/SunCanvas";
import { Footer } from "@/components/ui/Footer";
import { SoundToggle } from "@/components/ui/SoundToggle";

const serif = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SOLINA — Capturer la lumière",
  description:
    "SOLINA est une maison de bijoux méditerranéens. Or, pierre, soleil. Une expérience digitale immersive.",
  metadataBase: new URL("https://solina.bijoux"),
  openGraph: {
    title: "SOLINA — Capturer la lumière",
    description:
      "Bijoux solaires inspirés du sud. Une maison méditerranéenne.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#070D17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-night text-cream">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-[11px] focus:uppercase focus:tracking-[0.32em] focus:text-night"
        >
          Aller au contenu
        </a>
        <ContourLines />
        <SunCanvas />
        <PhaseRouter />
        <Nav />
        <main id="main" className="relative z-10">{children}</main>
        <Footer />
        <SoundToggle />
        <SunriseIntro />
      </body>
    </html>
  );
}
