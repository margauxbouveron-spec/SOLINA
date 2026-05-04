import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

import { LogoIntro } from "@/components/intro/LogoIntro";
import { Nav } from "@/components/nav/Nav";
import { PhaseRouter } from "@/components/sun/PhaseRouter";
import { SunCanvas } from "@/components/sun/SunCanvas";
import { Footer } from "@/components/ui/Footer";
import { SoundToggle } from "@/components/ui/SoundToggle";

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
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
  themeColor: "#F6F1E8",
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
      <body className="bg-cream">
        <SunCanvas />
        <PhaseRouter />
        <Nav />
        <main className="relative z-10">{children}</main>
        <Footer />
        <SoundToggle />
        <LogoIntro />
      </body>
    </html>
  );
}
